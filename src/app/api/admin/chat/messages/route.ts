// src/app/api/admin/chat/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/backend/lib/auth';
import { cookies } from 'next/headers';

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('lvs-session')?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });

  const messages = await db.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });

  // Mark visitor messages as read
  await db.chatMessage.updateMany({
    where: { sessionId, sender: 'visitor', status: 'unread' },
    data: { status: 'read' },
  });

  // Check visitor typing flag
  const typingKey = `chat_visitor_typing_${sessionId}`;
  const typingRecord = await db.siteSetting.findUnique({ where: { key: typingKey } });
  const visitorTyping = typingRecord
    ? Date.now() - new Date(typingRecord.value).getTime() < 5000
    : false;

  return NextResponse.json({
    success: true,
    data: {
      messages: messages.map((m) => ({
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
      })),
      visitor_typing: visitorTyping,
    },
  });
}
