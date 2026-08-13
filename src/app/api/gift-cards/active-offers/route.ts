import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const now = new Date();

    const activeOffers = await db.giftCardOffer.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { sellingPrice: "asc" },
    });

    // Filter out offers that have reached maxPurchases limit
    const availableOffers = activeOffers.filter(
      (offer) => offer.maxPurchases === null || offer.totalSold < offer.maxPurchases
    );

    return NextResponse.json({ success: true, offers: availableOffers });
  } catch (error: any) {
    console.error("GET /api/gift-cards/active-offers error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load gift card offers" },
      { status: 500 }
    );
  }
}
