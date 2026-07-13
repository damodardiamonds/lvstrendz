// src/app/api/admin/chat/reply/route.ts
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

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId, message } = await req.json();
  if (!sessionId || !message?.trim()) {
    return NextResponse.json({ error: 'sessionId and message required' }, { status: 400 });
  }

  // Verify session exists
  const session = await db.chatSession.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  // Save reply
  const chatMessage = await db.chatMessage.create({
    data: {
      sessionId,
      sender: 'concierge',
      message: message.trim(),
      status: 'unread',
    },
  });

  // Touch session updatedAt so it bubbles to top of thread list
  await db.chatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  // Clear admin typing flag
  const typingKey = `chat_typing_${sessionId}`;
  await db.siteSetting.deleteMany({ where: { key: typingKey } });

  return NextResponse.json({ success: true, messageId: chatMessage.id });
}
