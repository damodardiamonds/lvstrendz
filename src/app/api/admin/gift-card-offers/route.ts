import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

// GET: List all gift card offers
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const offers = await db.giftCardOffer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { giftCards: true },
        },
      },
    });

    return NextResponse.json({ success: true, offers });
  } catch (error: any) {
    console.error("GET /api/admin/gift-card-offers error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch offers" }, { status: 500 });
  }
}

// POST: Create a new gift card offer
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      name,
      faceValue,
      sellingPrice,
      startDate,
      endDate,
      maxPurchases,
      perUserLimit = 3,
      description,
      isActive = true,
    } = body;

    if (!name || faceValue === undefined || sellingPrice === undefined || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, face value, selling price, start date, and end date are required." },
        { status: 400 }
      );
    }

    const offer = await db.giftCardOffer.create({
      data: {
        name: name.trim(),
        faceValue: Number(faceValue),
        sellingPrice: Number(sellingPrice),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxPurchases: maxPurchases ? Number(maxPurchases) : null,
        perUserLimit: Number(perUserLimit || 3),
        description: description?.trim() || null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, offer });
  } catch (error: any) {
    console.error("POST /api/admin/gift-card-offers error:", error);
    return NextResponse.json({ error: error?.message || "Failed to create offer" }, { status: 500 });
  }
}
