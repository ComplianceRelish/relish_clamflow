// src/app/api/whatsapp/route.ts
// Server-side Twilio WhatsApp proxy — keeps credentials out of the browser bundle.
//
// Required Vercel env vars:
//   TWILIO_ACCOUNT_SID          — Twilio account SID
//   TWILIO_AUTH_TOKEN           — Twilio auth token
//   NEXT_PUBLIC_TWILIO_ENABLED  — set to "true" to enable sending
//
// Sender — ONE of:
//   TWILIO_MESSAGING_SERVICE_SID — preferred: Twilio Messaging Service SID
//   TWILIO_WHATSAPP_NUMBER      — fallback: e.g. "whatsapp:+14155238886"
//
// NOTE: This route always returns HTTP 200.  Twilio delivery errors are
// communicated through { success: false, error: string } in the JSON body so
// that service-workers / auth-middleware never mistake a Twilio 401 for a
// session-expiry and redirect the user to the login page.

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const accountSid       = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken        = process.env.TWILIO_AUTH_TOKEN?.trim();
  const messagingSvcSid  = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
  const whatsappNumber   = process.env.TWILIO_WHATSAPP_NUMBER?.trim();
  const enabled          = process.env.NEXT_PUBLIC_TWILIO_ENABLED === 'true';

  if (!enabled) {
    return NextResponse.json({ success: false, error: 'WhatsApp notifications are disabled (NEXT_PUBLIC_TWILIO_ENABLED is not "true")' });
  }

  if (!accountSid || !authToken) {
    return NextResponse.json(
      { success: false, error: 'Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in Vercel environment variables.' }
    );
  }

  if (!messagingSvcSid && !whatsappNumber) {
    return NextResponse.json(
      { success: false, error: 'No sender configured. Set MESSAGING_SERVICE_SID or TWILIO_WHATSAPP_NUMBER in Vercel environment variables.' }
    );
  }

  let body: { to?: string; messageBody?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' });
  }

  const { to, messageBody } = body;
  if (!to || !messageBody) {
    return NextResponse.json({ success: false, error: 'Missing required fields: to, messageBody' });
  }

  const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

  // Build Twilio payload — use MessagingServiceSid when available, else From
  const twilioParams: Record<string, string> = {
    To:   formattedTo,
    Body: messageBody,
  };
  if (messagingSvcSid) {
    twilioParams.MessagingServiceSid = messagingSvcSid;
  } else {
    twilioParams.From = whatsappNumber!.startsWith('whatsapp:')
      ? whatsappNumber!
      : `whatsapp:${whatsappNumber}`;
  }

  try {
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(twilioParams).toString(),
      }
    );

    const data = await twilioRes.json();

    if (twilioRes.ok) {
      return NextResponse.json({ success: true, messageSid: data.sid });
    }

    // Always return HTTP 200 — put Twilio's error in the body only
    const twilioError = data.message ?? data.detail ?? `Twilio error ${twilioRes.status}`;
    return NextResponse.json({ success: false, error: twilioError, twilioStatus: twilioRes.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

