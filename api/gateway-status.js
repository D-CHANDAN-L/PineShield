export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const hasTwilio = Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const hasGreenApi = Boolean(process.env.GREEN_API_INSTANCE_ID && process.env.GREEN_API_TOKEN);
  const hasUltraMsg = Boolean(process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN);

  let activeMode = 'dev_mock_automated';
  if (hasTwilio) activeMode = 'twilio_official';
  else if (hasGreenApi) activeMode = 'green_api_custom';
  else if (hasUltraMsg) activeMode = 'ultramsg_custom';

  return res.status(200).json({
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
}
