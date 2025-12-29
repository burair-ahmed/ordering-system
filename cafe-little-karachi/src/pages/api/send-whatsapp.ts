import { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID as string; // Twilio Account SID from environment variables
const authToken = process.env.TWILIO_AUTH_TOKEN as string; // Twilio Auth Token from environment variables
const client = twilio(accountSid, authToken);

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === 'POST') {
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ success: false, error: 'Message content is required.' });
      return;
    }

    try {
      const twilioResponse = await client.messages.create({
        from: 'whatsapp:+14155238886', // Twilio WhatsApp sandbox or approved number
        // to: 'whatsapp:+923331371141',
        to: 'whatsapp:+923077136555',
        body: message,
      });

      res.status(200).json({ success: true, sid: twilioResponse.sid });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error sending WhatsApp message:', errorMessage);
      res.status(500).json({ success: false, error: errorMessage });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
