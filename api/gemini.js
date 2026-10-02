import dotenv from 'dotenv';
dotenv.config();
import { PINE_LABS_SYSTEM_PROMPT } from '../src/utils/geminiPrompt.js';
import { retrieveRelevantChunks, formatGroundingContext } from '../src/utils/knowledgeRetriever.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    console.error('[Gemini Server Proxy] ERROR: Missing or unconfigured Gemini API key. Ensure GEMINI_API_KEY is set in .env (for local dev) or in Vercel Project Settings -> Environment Variables (for production).');
    return res.status(503).json({ error: 'Gemini API key not configured on server.' });
  }

  const { userInput, merchantContext = {} } = req.body || {};
  if (!userInput) {
    return res.status(400).json({ error: "Missing required field: 'userInput'" });
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

Follow system instructions. If the user question is related to the internal documents or Pine Labs POS operations, ground your answer strictly in the provided chunks. If it is general payments/POS knowledge not covered in internal documents, answer from general knowledge and prefix your reply with: "This isn't in our internal SOPs, but generally: ...". Output ONLY valid raw JSON with "intent", "isError", and matching fields. Do NOT include markdown fences.
`;

  const primaryModel = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const modelsToTry = [primaryModel];
  if (!modelsToTry.includes('gemini-flash-latest')) {
    modelsToTry.push('gemini-flash-latest');
  }

  const callModelWithBackoff = async (targetModel, maxRetries = 2) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: PINE_LABS_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
        })
      });
      if (res.ok) return res;
      if ((res.status === 503 || res.status === 429) && attempt < maxRetries) {
        console.warn(`[Gemini Server Proxy] Transient ${res.status} from Google for ${targetModel}. Waiting ${attempt * 1200}ms before retry...`);
        await new Promise(r => setTimeout(r, attempt * 1200));
        continue;
      }
      return res;
    }
  };

  try {
    let geminiRes;
    for (const targetModel of modelsToTry) {
      console.log(`[Gemini Server Proxy] API key present. Routing query to model: ${targetModel}`);
      geminiRes = await callModelWithBackoff(targetModel, 2);
      if (geminiRes.ok) break;

      const errData = await geminiRes.clone().json().catch(() => ({}));
      console.warn(`[Gemini Server Proxy] Model ${targetModel} responded with ${geminiRes.status}:`, errData?.error?.message || '');
      if (geminiRes.status !== 503 && geminiRes.status !== 429 && geminiRes.status !== 404) {
        break;
      }
      // Brief pause before trying next fallback model
      await new Promise(r => setTimeout(r, 800));
    }

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
      console.error(`[Gemini Server Proxy] Gemini API call failed with status ${geminiRes.status}:`, errData?.error?.message || 'Unknown error');
      return res.status(geminiRes.status).json({ error: errData?.error?.message || 'Gemini API error' });
    }

    const data = await geminiRes.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

    try {
      const parsed = JSON.parse(text);
      return res.status(200).json(parsed);
    } catch {
      return res.status(500).json({ error: 'Failed to parse Gemini response as JSON' });
    }
  } catch (err) {
    console.error('[Vercel /api/gemini] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
