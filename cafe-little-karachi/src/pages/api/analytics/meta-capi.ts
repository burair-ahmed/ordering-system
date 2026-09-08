import { NextApiRequest, NextApiResponse } from 'next';
import { sendMetaCapiEvent, SendMetaCapiEventOptions } from '../../../lib/metaCapi';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { eventName, eventId, eventSourceUrl, userData = {}, customData = {}, testEventCode } = req.body;

    if (!eventName) {
      return res.status(400).json({ success: false, message: 'Missing eventName parameter' });
    }

    // Extract client IP and user-agent from request headers
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIp =
      (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : undefined) ||
      req.socket.remoteAddress ||
      userData.clientIp;

    const clientUserAgent = req.headers['user-agent'] || userData.clientUserAgent;

    // Extract _fbp and _fbc from cookies if available
    const fbp = req.cookies['_fbp'] || userData.fbp;
    const fbc = req.cookies['_fbc'] || userData.fbc;

    const options: SendMetaCapiEventOptions = {
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || (req.headers.referer ? String(req.headers.referer) : undefined),
      userData: {
        ...userData,
        clientIp,
        clientUserAgent,
        fbp,
        fbc,
      },
      customData,
      testEventCode,
    };

    const result = await sendMetaCapiEvent(options);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error: any) {
    console.error('[MetaCapi Endpoint] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process Conversions API event',
      error: error.message,
    });
  }
}
