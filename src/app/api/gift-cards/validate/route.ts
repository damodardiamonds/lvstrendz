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

    const giftCard = await db.giftCard.findFirst({
      where: {
        code: {
          equals: code.trim(),
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

    if (!giftCard.isActive) {
      return NextResponse.json(
        { error: "This gift card is inactive" },
        { status: 400 }
      );
    }

    const balance = Number(giftCard.balance);
    if (balance <= 0) {
      return NextResponse.json(
        { error: "This gift card has zero balance remaining" },
        { status: 400 }
      );
    }

    const now = new Date();
    if (giftCard.expiresAt && giftCard.expiresAt < now) {
      return NextResponse.json(
        { error: "This gift card has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        initialValue: Number(giftCard.initialValue),
        balance: balance,
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
