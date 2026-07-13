// src/app/api/admin/push-token/route.ts
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

// Mobile app registers its Expo push token here
export async function POST(req: NextRequest) {
  try {
    // Allow both authenticated and token-based auth for mobile
    const body = await req.json();
    const { pushToken, adminToken } = body;

    if (!pushToken) {
      return NextResponse.json({ error: 'pushToken required' }, { status: 400 });
    }

    // Verify either cookie session or bearer token
    let isAdmin = false;
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get('lvs-session')?.value;

    if (cookieToken) {
      const payload = await verifyToken(cookieToken);
      if (payload?.role === 'ADMIN') isAdmin = true;
    }

    if (!isAdmin && adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload?.role === 'ADMIN') isAdmin = true;
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert the push token
    await db.adminPushToken.upsert({
      where: { token: pushToken },
      update: {},
      create: { token: pushToken },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Push token error:', error);
    return NextResponse.json({ error: 'Failed to register push token' }, { status: 500 });
  }
}
