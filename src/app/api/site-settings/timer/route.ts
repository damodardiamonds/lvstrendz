import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SETTING_KEY = "countdown_timer";

export async function GET() {
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
      bannerImage: "https://res.cloudinary.com/n5umtsub/image/upload/v1785663378/lvstrendz/hero/slide-2.webp",
    };

    if (setting && setting.value) {
      try {
        data = { ...data, ...JSON.parse(setting.value) };
      } catch (e) {
        console.error("Failed to parse timer setting JSON", e);
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
