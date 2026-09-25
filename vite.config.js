import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { handleWhatsAppDispatch } from './src/services/whatsappGateway.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'sentinel-whatsapp-api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Handle POST /api/send-whatsapp & /api/whatsapp/send
          if ((req.url === '/api/send-whatsapp' || req.url === '/api/whatsapp/send') && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const result = await handleWhatsAppDispatch(parsed);
                res.writeHead(result.status, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result.data));
              } catch (e) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message || 'Internal dispatch error' }));
              }
            });
            return;
          }

          // Handle GET /api/gateway-status
          if (req.url === '/api/gateway-status' && req.method === 'GET') {
            const hasTwilio = Boolean(process.env?.TWILIO_ACCOUNT_SID && process.env?.TWILIO_AUTH_TOKEN);
            const hasGreenApi = Boolean(process.env?.GREEN_API_INSTANCE_ID && process.env?.GREEN_API_TOKEN);
            const hasUltraMsg = Boolean(process.env?.ULTRAMSG_INSTANCE_ID && process.env?.ULTRAMSG_TOKEN);

            let activeMode = 'dev_mock_automated';
            if (hasTwilio) activeMode = 'twilio_official';
            else if (hasGreenApi) activeMode = 'green_api_custom';
            else if (hasUltraMsg) activeMode = 'ultramsg_custom';

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              status: 'online',
              timestamp: new Date().toISOString(),
              activeMode,
              configuredGateways: {
                twilio: hasTwilio,
                greenApi: hasGreenApi,
                ultraMsg: hasUltraMsg,
                mockAutomated: true
              },
              service: 'Pine Labs POS Sentinel Automated WhatsApp Dispatcher (Vite Dev Server Bridge)'
            }));
            return;
          }

          next();
        });
      }
    }
  ],
})
