import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Vercel Cron Job: Auto-disables gift card offers past their end date.
 * Configured in vercel.json to run daily at 18:30 UTC (Midnight IST).
 */
export async function GET() {
  try {
    const now = new Date();

    const result = await db.giftCardOffer.updateMany({
      where: {
        endDate: { lt: now },
        isActive: true,
      },
      data: { isActive: false },
    });

    console.log(`[cron/expire-offers] Auto-disabled ${result.count} expired gift card offer(s).`);

    return NextResponse.json({
      success: true,
      expiredCount: result.count,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Error in cron/expire-offers:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to expire offers" },
      { status: 500 }
    );
  }
}
