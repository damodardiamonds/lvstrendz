// src/app/api/admin/media-settings/route.ts
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/session';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const keys = ['homepage_hero_slides', 'homepage_collections', 'about_us_media', 'faqs_media'];
    const settings = await db.siteSetting.findMany({
      where: {
        key: { in: keys },
      },
    });

    // Reduce array of settings to a settings key-value map
    const settingsMap = settings.reduce((acc, curr) => {
      try {
        acc[curr.key] = JSON.parse(curr.value);
      } catch {
        acc[curr.key] = curr.value;
      }
      return acc;
    }, {} as Record<string, any>);

    return NextResponse.json(settingsMap);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const valueStr = JSON.stringify(value);

    const setting = await db.siteSetting.upsert({
      where: { key },
      update: { value: valueStr },
      create: { key, value: valueStr, type: 'json' },
    });

    // Purge the static cache for affected public pages to reflect changes instantly
    revalidatePath('/');
    revalidatePath('/about-us');
    revalidatePath('/faqs');

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
