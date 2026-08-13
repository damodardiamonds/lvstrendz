import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendGiftCardEmail } from "@/backend/lib/email";

// Helper function to generate unique gift card code: LVS-XXXXXXXX
async function generateUniqueCode(): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let isUnique = false;
  let code = "";

  while (!isUnique) {
    let randomPart = "";
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code = `LVS-${randomPart}`;

    const existing = await db.giftCard.findUnique({
      where: { code },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      purchasedBy,
      senderName,
      isGift = false,
      recipientName,
      recipientEmail,
      personalMessage,
      paymentId,
    } = body;

    // Validation
    const buyerEmail = purchasedBy?.trim().toLowerCase();
    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json(
        { error: "Valid buyer email is required." },
        { status: 400 }
      );
    }

    if (isGift) {
      if (!recipientName?.trim()) {
        return NextResponse.json(
          { error: "Recipient name is required when sending as a gift." },
          { status: 400 }
        );
      }
      const recEmail = recipientEmail?.trim().toLowerCase();
      if (!recEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recEmail)) {
        return NextResponse.json(
          { error: "Valid recipient email is required when sending as a gift." },
          { status: 400 }
        );
      }
    }

    // Generate code LVS-XXXXXXXX
    const code = await generateUniqueCode();

    const targetRecipientEmail = isGift
      ? recipientEmail.trim().toLowerCase()
      : buyerEmail;

    // Create GiftCard record in DB
    const giftCard = await db.giftCard.create({
      data: {
        code,
        value: 1000,
        balance: 1000,
        purchasedBy: buyerEmail,
        purchasedAt: new Date(),
        isRedeemed: false,
        isGift: Boolean(isGift),
        senderName: senderName?.trim() || null,
        recipientName: isGift ? recipientName.trim() : null,
        recipientEmail: isGift ? recipientEmail.trim().toLowerCase() : null,
        personalMessage: personalMessage?.trim() || null,
      },
    });

    console.log(`[gift-cards/purchase] Gift card created: ${code} for ${targetRecipientEmail}`);

    // Send email using Resend
    const emailResult = await sendGiftCardEmail({
      recipientEmail: targetRecipientEmail,
      code: giftCard.code,
      value: giftCard.value,
      isGift: giftCard.isGift,
      senderName: giftCard.senderName || undefined,
      recipientName: giftCard.recipientName || undefined,
      personalMessage: giftCard.personalMessage || undefined,
      purchasedBy: buyerEmail,
    });

    return NextResponse.json({
      success: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        value: giftCard.value,
        balance: giftCard.balance,
        purchasedBy: giftCard.purchasedBy,
        purchasedAt: giftCard.purchasedAt,
        isGift: giftCard.isGift,
        recipientName: giftCard.recipientName,
        recipientEmail: giftCard.recipientEmail,
        senderName: giftCard.senderName,
      },
      emailResult,
    });
  } catch (error: any) {
    console.error("Gift card purchase API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate gift card" },
      { status: 500 }
    );
  }
}
