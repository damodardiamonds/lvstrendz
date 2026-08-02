import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const SETTING_KEY = "countdown_timer";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    let data = {
      isActive: true,
      tagline: "Flat 20% OFF",
      title: "Limited Time Offer! Don't Miss Out!",
      endDate: new Date(Date.now() + 15 * 86400 * 1000 + 23 * 3600 * 1000).toISOString(),
      buttonText: "Shop Now →",
      buttonLink: "/shop",
      bannerImage: "https://lvstrendz.com/wp-content/uploads/2026/05/ChatGPT-Image-May-15-2026-12_08_18-AM.webp",
    };

    if (setting && setting.value) {
      try {
        data = { ...data, ...JSON.parse(setting.value) };
      } catch (e) {
        console.error("Failed to parse timer setting JSON", e);
      }
    }

    return NextResponse.json({ success: true, settings: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const valueStr = JSON.stringify(body);

    const setting = await db.siteSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: valueStr },
      create: { key: SETTING_KEY, value: valueStr, type: "json" },
    });

    revalidatePath("/");
    revalidatePath("/shop");

    return NextResponse.json({ success: true, setting });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
