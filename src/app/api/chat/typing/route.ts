// src/app/api/chat/typing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'lvs_chat_session';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionToken) return NextResponse.json({ success: false });

    const session = await db.chatSession.findUnique({ where: { sessionToken } });
    if (!session) return NextResponse.json({ success: false });

    // Store visitor typing flag in SiteSetting as a lightweight transient
    const key = `chat_visitor_typing_${session.id}`;
    const body = await req.json();
    const isTyping = body.typing === true || body.typing === '1';

    if (isTyping) {
      await db.siteSetting.upsert({
        where: { key },
        update: { value: new Date().toISOString() },
        create: { key, value: new Date().toISOString(), type: 'transient' },
      });
    } else {
      await db.siteSetting.deleteMany({ where: { key } });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
