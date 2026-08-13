import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderTotal, userId, orderId } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Gift card code is required" },
        { status: 400 }
      );
    }

    const numericOrderTotal = Number(orderTotal);
    if (isNaN(numericOrderTotal) || numericOrderTotal < 0) {
      return NextResponse.json(
        { error: "Valid order total is required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();

    // Find gift card case-insensitively
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

    const currentBalance = Number(giftCard.balance);
    if (currentBalance <= 0 || giftCard.isRedeemed) {
      return NextResponse.json(
        { error: "This gift card has already been fully redeemed" },
        { status: 400 }
      );
    }

    // Deduction logic
    const deductionAmount = Math.min(currentBalance, numericOrderTotal);
    const newBalance = currentBalance - deductionAmount;
    const isFullyRedeemed = newBalance === 0;

    // Atomic update in database
    const updatedGiftCard = await db.giftCard.update({
      where: { id: giftCard.id },
      data: {
        balance: newBalance,
        isRedeemed: isFullyRedeemed,
        redeemedBy: userId || giftCard.redeemedBy || null,
        redeemedAt: new Date(),
        orderId: orderId || giftCard.orderId || null,
      },
    });

    const remainingOrderTotal = Math.max(0, numericOrderTotal - deductionAmount);

    console.log(
      `[gift-cards/redeem] Redeemed ${deductionAmount} from code ${giftCard.code}. New balance: ${newBalance}. Remaining order total: ${remainingOrderTotal}`
    );

    return NextResponse.json({
      success: true,
      deductionAmount,
      remainingBalance: newBalance,
      remainingOrderTotal,
      isFullyRedeemed,
      giftCard: {
        id: updatedGiftCard.id,
        code: updatedGiftCard.code,
        balance: newBalance,
      },
    });
  } catch (error: any) {
    console.error("Gift card redemption error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to redeem gift card" },
      { status: 500 }
    );
  }
}
