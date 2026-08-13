import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Gift card code is required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();

    const giftCard = await db.giftCard.findFirst({
      where: {
        code: {
          equals: cleanCode,
          mode: "insensitive",
        },
      },
    });

    if (!giftCard) {
      return NextResponse.json(
        { error: "Invalid gift card code" },
        { status: 404 }
      );
    }

    const balance = Number(giftCard.balance);
    if (balance <= 0 || giftCard.isRedeemed) {
      return NextResponse.json(
        { error: "This gift card has zero balance remaining" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        value: Number(giftCard.value),
        balance: balance,
        isGift: giftCard.isGift,
        senderName: giftCard.senderName,
      },
    });
  } catch (error) {
    console.error("Gift card validation error:", error);
    return NextResponse.json(
      { error: "Failed to validate gift card" },
      { status: 500 }
    );
  }
}
