import { handleWhatsAppDispatch } from '../../src/services/whatsappGateway.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const result = await handleWhatsAppDispatch(req.body);
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error('[Vercel API] WhatsApp dispatch error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during automated dispatch'
    });
  }
}
