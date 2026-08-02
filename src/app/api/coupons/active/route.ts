import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    // Fetch the most recently created active coupon that is valid
    const coupon = await db.coupon.findFirst({
      where: {
        isActive: true,
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } }
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gte: now } }
            ]
          }
        ]
      },
      orderBy: { createdAt: "desc" },
    });

    if (!coupon) {
      return NextResponse.json({ success: true, coupon: null });
    }

    // Check usage limit if set
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ success: true, coupon: null });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: Number(coupon.value),
        minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
      },
    });
  } catch (error: any) {
    console.error("Error fetching active coupon:", error);
    return NextResponse.json(
      { error: "Failed to fetch active coupon" },
      { status: 500 }
    );
  }
}
