import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleWhatsAppDispatch } from './src/services/whatsappGateway.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[Sentinel API Bridge] ${req.method} ${req.path}`);
  }
  next();
});

// POST endpoint for automated WhatsApp dispatch
app.post(['/api/send-whatsapp', '/api/whatsapp/send'], async (req, res) => {
  try {
    const result = await handleWhatsAppDispatch(req.body);
    return res.status(result.status).json(result.data);
  } catch (error) {
    console.error('[API Error in WhatsApp dispatch]', error);
    return res.status(500).json({
      error: error.message || 'Internal server error during automated dispatch'
    });
  }
});

// GET gateway status & configurations
app.get('/api/gateway-status', (req, res) => {
  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const hasGreenApi = Boolean(process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN);
  const hasUltraMsg = Boolean(process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN);

  let activeMode = 'dev_mock_automated';
  if (hasTwilio) activeMode = 'twilio_official';
  else if (hasGreenApi) activeMode = 'green_api_custom';
  else if (hasUltraMsg) activeMode = 'ultramsg_custom';

  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    activeMode,
    configuredGateways: {
      twilio: hasTwilio,
      greenApi: hasGreenApi,
      ultraMsg: hasUltraMsg,
      mockAutomated: true
    },
    service: 'PineShield Automated WhatsApp Dispatcher'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Sentinel API Bridge] Listening on http://localhost:${PORT}`);
    console.log(`[Sentinel API Bridge] Endpoint ready at POST http://localhost:${PORT}/api/send-whatsapp`);
  });
}

export { handleWhatsAppDispatch };
export default app;
