import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const SETTING_KEY = "announcement_bar";

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
  try {
    const setting = await db.siteSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    let data = {
      isActive: true,
      text: "Flat 20% OFF! Use Code:",
      couponCode: "FLAT20",
      showCoupon: true,
      buttonText: "Shop Now",
      buttonLink: "/shop",
      bgColor: "#A0463E",
      textColor: "#FFFFFF",
    };

    if (setting && setting.value) {
      try {
        const parsed = JSON.parse(setting.value);
        data = { ...data, ...parsed };
      } catch (e) {
        console.error("Failed to parse announcement_bar setting JSON", e);
      }
    }

    return NextResponse.json({ success: true, announcement: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}
