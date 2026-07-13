// src/app/api/chat/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'lvs_chat_session';

async function sendExpoPushNotification(title: string, body: string) {
  try {
    const tokens = await db.adminPushToken.findMany();
    if (!tokens.length) return;

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: 'default',
      title,
      body,
      data: { screen: 'chat' },
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error('Push notification error:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, email, productTitle, productUrl, attachment } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    let sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    // Find or create session
    let session = sessionToken
      ? await db.chatSession.findUnique({ where: { sessionToken } })
      : null;

    if (!session) {
      sessionToken = `lvs_${crypto.randomUUID()}`;
      session = await db.chatSession.create({
        data: {
          sessionToken,
          email: email || null,
          productTitle: productTitle || null,
          productUrl: productUrl || null,
        },
      });
    } else if (email && !session.email) {
      // Update email if now provided
      session = await db.chatSession.update({
        where: { id: session.id },
        data: { email },
      });
    }

    // Save message
    const chatMessage = await db.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'visitor',
        message: message.trim(),
        attachment: attachment || null,
        status: 'unread',
      },
    });

    // Send push notification to admin
    const senderLabel = email || 'A visitor';
    await sendExpoPushNotification(
      `💬 New message from ${senderLabel}`,
      message.trim().slice(0, 100)
    );

    const response = NextResponse.json({ success: true, messageId: chatMessage.id });

    // Set session cookie
    response.cookies.set(SESSION_COOKIE, sessionToken!, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Chat send error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
