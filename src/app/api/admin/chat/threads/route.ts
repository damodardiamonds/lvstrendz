// src/app/api/admin/chat/threads/route.ts
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
  const archived = searchParams.get('archived') === '1';

  const sessions = await db.chatSession.findMany({
    where: { archived },
    orderBy: { updatedAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  const threads = sessions.map((s) => {
    const latest = s.messages[0];
    return {
      id: s.id,
      email: s.email || 'Anonymous',
      productTitle: s.productTitle,
      productUrl: s.productUrl,
      adminNote: s.adminNote,
      archived: s.archived,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      latestMessage: latest?.message || '',
      latestSender: latest?.sender || '',
      latestStatus: latest?.status || 'read',
      unread: latest?.sender === 'visitor' && latest?.status === 'unread',
      timeAgo: formatTimeAgo(s.updatedAt),
    };
  });

  return NextResponse.json({ success: true, data: threads });
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
