import { processGeminiRequest } from '../src/utils/geminiCore.js';

/**
 * Vercel Serverless Function: /api/gemini
 * Delegates directly to the unified processor in src/utils/geminiCore.js.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userInput, merchantContext = {} } = req.body || {};
  const result = await processGeminiRequest({ userInput, merchantContext });
  return res.status(result.status).json(result.data);
}
