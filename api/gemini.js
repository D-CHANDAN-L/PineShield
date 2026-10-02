import dotenv from 'dotenv';
dotenv.config();
import { PINE_LABS_SYSTEM_PROMPT } from '../src/utils/geminiPrompt.js';
import { retrieveRelevantChunks, formatGroundingContext } from '../src/utils/knowledgeRetriever.js';
import { matchStaticSop } from '../src/utils/gemini.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userInput, merchantContext = {} } = req.body || {};
  if (!userInput) {
    return res.status(400).json({ error: "Missing required field: 'userInput'" });
  }

  // 1. FAST PATH: If query matches an exact or near-exact diagnostic error code, return verified SOP record immediately
  const sopResult = matchStaticSop(userInput, merchantContext);
  if (sopResult && sopResult.isError) {
    return res.status(200).json(sopResult);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    console.error('[Gemini Server Proxy] ERROR: Missing or unconfigured Gemini API key. Ensure GEMINI_API_KEY is set in .env (for local dev) or in Vercel Project Settings -> Environment Variables (for production).');
    return res.status(503).json({ error: 'Gemini API key not configured on server.' });
  }

  // Pre-retrieval: fetch top 5-10 most relevant internal document chunks
  const relevantChunks = retrieveRelevantChunks(userInput, 8);
  const groundingContext = formatGroundingContext(relevantChunks);

  const prompt = `
CURRENT MERCHANT CONTEXT:
- Store: ${merchantContext.storeName || 'Croma Electronics'} (${merchantContext.city || 'Bengaluru'})
- Manager: ${merchantContext.managerName || 'Rajesh Kumar'}
- POS ID: ${merchantContext.posId || 'POS_992144'}
- Architecture: ${merchantContext.architecture || 'Non-Aggregator'}
- Bound Acquirer: ${merchantContext.acquirer || 'HDFC Bank'}
- Card TID: ${merchantContext.tid || 'TID_HDFC_9910'}

RETRIEVED INTERNAL DOCUMENTATION CHUNKS:
${groundingContext}

USER QUERY:
"${userInput}"

INSTRUCTIONS ON SYNTHESIS & CONTEXT USAGE:
- Read the USER QUERY carefully. Synthesize a direct, natural response tailored specifically to what the merchant is asking and its scope.
- Priority 1 (High-confidence internal SOP): If high-confidence internal documentation chunks are provided under RETRIEVED INTERNAL DOCUMENTATION CHUNKS, synthesize your response directly from them. Do NOT copy the chunks verbatim.
- Priority 2 (General knowledge / low-confidence fallback): If the retrieved knowledge chunks are empty or explicitly marked as low-confidence / uncertain, do NOT force them into the answer or present them as definitive internal SOPs. Instead, answer using general POS/payment terminal knowledge and prefix your response with: "This isn't specifically covered in our internal SOPs, but generally: ...".
- Priority 3 (Current external facts / RBI guidelines): Use Google Search grounding results when provided for current regulations, circulars, or external facts not in internal SOPs.
- Output ONLY valid raw JSON with "intent", "isError", and matching fields. Do NOT include markdown fences.
`;

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const modelsToTry = [
    primaryModel,
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview'
  ].filter((v, i, a) => a.indexOf(v) === i);

  const callModelWithBackoff = async (targetModel, maxRetries = 2) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // 1. First attempt with Google Search grounding tool enabled
      try {
        const resWithTools = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: PINE_LABS_SYSTEM_PROMPT }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: { temperature: 0.35 }
          })
        });

        if (resWithTools.ok) {
          return resWithTools;
        }

        // If tools returned 429 quota or 400 incompatibility, fall back to generation without tools
        if (resWithTools.status === 429 || resWithTools.status === 400) {
          const toolErrData = await resWithTools.clone().json().catch(() => ({}));
          console.error(`[Gemini Server Proxy] ⚠️ SEARCH GROUNDING REJECTED BY GOOGLE API (${resWithTools.status}):`, JSON.stringify(toolErrData?.error || {}));
          console.warn(`[Gemini Server Proxy] Note: Google Search Grounding requires a billing-enabled (Paid Tier) Google AI Studio API key. Falling back to non-grounded generation for ${targetModel}...`);
          
          const resNoTools = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: PINE_LABS_SYSTEM_PROMPT }] },
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.35 }
            })
          });
          if (resNoTools.ok) {
            resNoTools._searchRejection = {
              status: resWithTools.status,
              error: toolErrData?.error?.message || 'Search grounding rejected by Google API quota/tier restriction.'
            };
            return resNoTools;
          }
        }

        if (resWithTools.status === 503 && attempt < maxRetries) {
          console.warn(`[Gemini Server Proxy] Transient 503 from Google for ${targetModel}. Waiting ${attempt * 1200}ms before retry...`);
          await new Promise(r => setTimeout(r, attempt * 1200));
          continue;
        }

        return resWithTools;
      } catch (networkErr) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, attempt * 1200));
          continue;
        }
        throw networkErr;
      }
    }
  };

  try {
    let geminiRes;
    for (const targetModel of modelsToTry) {
      console.log(`[Gemini Server Proxy] API key present. Routing query to model: ${targetModel}`);
      geminiRes = await callModelWithBackoff(targetModel, 2);
      if (geminiRes && geminiRes.ok) break;

      const errData = await geminiRes?.clone().json().catch(() => ({}));
      console.warn(`[Gemini Server Proxy] Model ${targetModel} responded with ${geminiRes?.status}:`, errData?.error?.message || '');
      if (geminiRes?.status !== 503 && geminiRes?.status !== 429 && geminiRes?.status !== 404) {
        break;
      }
      // Brief pause before trying next fallback model
      await new Promise(r => setTimeout(r, 600));
    }

    if (!geminiRes || !geminiRes.ok) {
      const errData = await geminiRes?.json().catch(() => ({}));
      console.error(`[Gemini Server Proxy] Gemini API call failed with status ${geminiRes?.status}:`, errData?.error?.message || 'Unknown error');
      return res.status(geminiRes?.status || 500).json({ error: errData?.error?.message || 'Gemini API error' });
    }

    const data = await geminiRes.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(text);
      const grounding = data.candidates?.[0]?.groundingMetadata || null;
      
      // Explicit error and status surfacing for Search Grounding
      if (grounding) {
        parsed.groundingMetadata = grounding;
        parsed.searchGrounding = {
          attempted: true,
          executed: true,
          status: 'SUCCESS',
          groundingMetadata: grounding
        };
      } else if (geminiRes._searchRejection) {
        parsed.groundingMetadata = null;
        parsed.searchGrounding = {
          attempted: true,
          executed: false,
          status: `REJECTED_HTTP_${geminiRes._searchRejection.status}`,
          error: geminiRes._searchRejection.error
        };
      } else {
        parsed.groundingMetadata = null;
        parsed.searchGrounding = {
          attempted: true,
          executed: false,
          status: 'NOT_TRIGGERED_OR_EMPTY',
          groundingMetadata: null
        };
      }

      return res.status(200).json(parsed);
    } catch {
      return res.status(500).json({ error: 'Failed to parse Gemini response as JSON' });
    }
  } catch (err) {
    console.error('[Vercel /api/gemini] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
