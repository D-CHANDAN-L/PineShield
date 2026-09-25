import { PINE_LABS_SYSTEM_PROMPT } from '../src/utils/geminiPrompt.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY; // Server-side only — never exposed to browser
  if (!apiKey || apiKey.trim() === '' || apiKey.trim() === 'your_gemini_api_key_here') {
    return res.status(503).json({ error: 'Gemini API key not configured on server.' });
  }

  const { userInput, merchantContext = {} } = req.body || {};
  if (!userInput) {
    return res.status(400).json({ error: "Missing required field: 'userInput'" });
  }

  const prompt = `
CURRENT MERCHANT CONTEXT:
- Store: ${merchantContext.storeName || 'Croma Electronics'} (${merchantContext.city || 'Bengaluru'})
- Manager: ${merchantContext.managerName || 'Rajesh Kumar'}
- POS ID: ${merchantContext.posId || 'POS_992144'}
- Architecture: ${merchantContext.architecture || 'Non-Aggregator'}
- Bound Acquirer: ${merchantContext.acquirer || 'HDFC Bank'}
- Card TID: ${merchantContext.tid || 'TID_HDFC_9910'}

USER QUERY:
"${userInput}"

Follow system instructions. Output ONLY valid raw JSON with "intent", "isError", and matching fields. Do NOT include markdown fences.
`;

  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;

  try {
    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: PINE_LABS_SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, response_mime_type: 'application/json' }
      })
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.json().catch(() => ({}));
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
