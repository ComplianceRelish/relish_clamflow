// src/app/api/whatsapp/route.ts
// Server-side Twilio WhatsApp proxy — keeps credentials out of the browser bundle.
// Required Vercel env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
//   TWILIO_WHATSAPP_NUMBER, NEXT_PUBLIC_TWILIO_ENABLED

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER ?? 'whatsapp:+14155238886';
  const enabled    = process.env.NEXT_PUBLIC_TWILIO_ENABLED === 'true';

  if (!enabled) {
    return NextResponse.json({ success: false, message: 'WhatsApp notifications are disabled' });
  }

  if (!accountSid || !authToken) {
    return NextResponse.json(
      { success: false, error: 'Twilio credentials not configured on server' },
      { status: 500 }
    );
  }

  let body: { to?: string; messageBody?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const { to, messageBody } = body;
  if (!to || !messageBody) {
    return NextResponse.json(
      { success: false, error: 'Missing required fields: to, messageBody' },
      { status: 400 }
    );
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  try {
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To:   formattedTo,
          Body: messageBody,
        }).toString(),
      }
    );

    const data = await twilioRes.json();

    if (twilioRes.ok) {
      return NextResponse.json({ success: true, messageSid: data.sid });
    }
    return NextResponse.json(
      { success: false, error: data.message ?? 'Twilio error' },
      { status: twilioRes.status }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
