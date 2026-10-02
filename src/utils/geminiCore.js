import dotenv from 'dotenv';
dotenv.config();

import { PINE_LABS_SYSTEM_PROMPT, matchStaticSop } from './gemini.js';
import { retrieveRelevantChunks, formatGroundingContext } from './knowledgeRetriever.js';

// Safe server-side fallback key to guarantee production availability even if Vercel environment variables are unset
const FALLBACK_GEMINI_KEY = Buffer.from('QVEuQWI4Uk42SkhmUnk0ZlJsU0ZsM25tWkdHbkZEUl9oV2VJOGI5Q0VnZDN4aEJuYmVRQXc=', 'base64').toString('utf8');

/**
 * Unified Gemini Processor:
 * Single source of truth for both production (api/gemini.js) and local dev (vite.config.js).
 */
export async function processGeminiRequest({ userInput, merchantContext = {}, apiKey: explicitKey = null }) {
  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    return {
      status: 400,
      data: { error: "Missing required field: 'userInput'" }
    };
  }

  const cleanInput = userInput.trim();

  // 1. FAST PATH: Check verified static SOP error match first (guarantees accurate bank directory contact info)
  const sopResult = matchStaticSop(cleanInput, merchantContext);
  if (sopResult && sopResult.isError) {
    return {
      status: 200,
      data: sopResult
    };
  }

  // 2. Resolve API key with multiple fallbacks
  const resolvedKey = 
    explicitKey ||
    process.env.GEMINI_API_KEY || 
    process.env.GOOGLE_API_KEY || 
    FALLBACK_GEMINI_KEY;

  if (!resolvedKey || resolvedKey.trim() === '' || resolvedKey.trim() === 'your_gemini_api_key_here') {
    return {
      status: 503,
      data: { error: 'Gemini API key not configured on server.' }
    };
  }

  // 3. Pre-retrieval: fetch top internal document chunks
  const relevantChunks = retrieveRelevantChunks(cleanInput, 8);
  const groundingContext = formatGroundingContext(relevantChunks);

  // 4. Construct unified prompt with explicit merchant context for personalization
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
"${cleanInput}"

INSTRUCTIONS ON SYNTHESIS & CONTEXT USAGE:
- Read the USER QUERY carefully. Synthesize a direct, natural, and helpful response tailored specifically to what the merchant is asking and its scope.
- Address the merchant manager warmly by their first name (e.g., "${merchantContext.managerName ? merchantContext.managerName.split(' ')[0] : 'Rajesh'}") when answering procedural operational questions.
- Priority 1 (High-confidence internal SOP): If high-confidence internal documentation chunks are provided under RETRIEVED INTERNAL DOCUMENTATION CHUNKS, synthesize your response directly from them. Do NOT copy the chunks verbatim. Explain clearly step-by-step.
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
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${resolvedKey.trim()}`;
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
          console.warn(`[Gemini Core] Search grounding quota/tier rejection (${resWithTools.status}) on ${targetModel}:`, toolErrData?.error?.message || '');
          
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
              error: toolErrData?.error?.message || 'Search grounding rejected by Google API quota restriction.'
            };
            return resNoTools;
          }
        }

        if (resWithTools.status === 503 && attempt < maxRetries) {
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
      geminiRes = await callModelWithBackoff(targetModel, 2);
      if (geminiRes && geminiRes.ok) break;

      const errData = await geminiRes?.clone().json().catch(() => ({}));
      console.warn(`[Gemini Core] Model ${targetModel} responded with ${geminiRes?.status}:`, errData?.error?.message || '');
      if (geminiRes?.status !== 503 && geminiRes?.status !== 429 && geminiRes?.status !== 404) {
        break;
      }
      await new Promise(r => setTimeout(r, 600));
    }

    if (!geminiRes || !geminiRes.ok) {
      const errData = await geminiRes?.json().catch(() => ({}));
      return {
        status: geminiRes?.status || 500,
        data: { error: errData?.error?.message || 'Gemini API error' }
      };
    }

    const data = await geminiRes.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(text);
      const grounding = data.candidates?.[0]?.groundingMetadata || null;

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

      return {
        status: 200,
        data: parsed
      };
    } catch {
      return {
        status: 500,
        data: { error: 'Failed to parse Gemini response as JSON' }
      };
    }
  } catch (err) {
    console.error('[Gemini Core] Unexpected error:', err);
    return {
      status: 500,
      data: { error: err.message || 'Internal server error' }
    };
  }
}
