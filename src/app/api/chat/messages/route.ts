// src/app/api/chat/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'lvs_chat_session';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: true, data: { messages: [], admin_typing: false } });
    }

    const session = await db.chatSession.findUnique({
      where: { sessionToken },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ success: true, data: { messages: [], admin_typing: false } });
    }

    // Mark all concierge messages as read (visitor has seen them)
    await db.chatMessage.updateMany({
      where: {
        sessionId: session.id,
        sender: 'concierge',
        status: 'unread',
      },
      data: { status: 'read' },
    });

    // Check if admin is typing (stored as a SiteSetting transient)
    const typingKey = `chat_typing_${session.id}`;
    const typingRecord = await db.siteSetting.findUnique({ where: { key: typingKey } });
    const adminTyping = typingRecord
      ? Date.now() - new Date(typingRecord.value).getTime() < 5000
      : false;

    const messages = session.messages.map((m) => ({
      id: m.id,
      sender: m.sender,
      message: m.message,
      status: m.status,
      attachment: m.attachment,
      createdAt: m.createdAt,
      time: new Date(m.createdAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

    return NextResponse.json({ success: true, data: { messages, admin_typing: adminTyping } });
  } catch (error: any) {
    console.error('Chat messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
