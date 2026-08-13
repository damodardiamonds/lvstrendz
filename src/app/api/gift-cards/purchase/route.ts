import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendGiftCardEmail, sendGiftCardBuyerConfirmationEmail } from "@/backend/lib/email";

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
      offerId,
      email,
      purchasedBy,
      senderName,
      isGift = false,
      recipientName,
      recipientEmail,
      recipientPhone,
      personalMessage,
      sharedVia = "email",
    } = body;

    const buyerEmail = (email || purchasedBy)?.trim().toLowerCase();
    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return NextResponse.json(
        { error: "Valid buyer email address is required." },
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
          { error: "Valid recipient email address is required when sending as a gift." },
          { status: 400 }
        );
      }
      // Self-email prevention rule
      if (recEmail === buyerEmail) {
        return NextResponse.json(
          { error: "Recipient email cannot be your own email address. Use 'Buy for myself' instead." },
          { status: 400 }
        );
      }
    }

    // 1. Resolve Offer (or fallback to active offer)
    const now = new Date();
    let offer = null;

    if (offerId) {
      offer = await db.giftCardOffer.findUnique({ where: { id: offerId } });
    } else {
      offer = await db.giftCardOffer.findFirst({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { sellingPrice: "asc" },
      });
    }

    if (!offer) {
      return NextResponse.json(
        { error: "No active gift card offer found. Please try again." },
        { status: 404 }
      );
    }

    // 2. Validate offer status & date bounds
    if (!offer.isActive) {
      return NextResponse.json({ error: "This gift card offer has been deactivated." }, { status: 400 });
    }

    if (offer.startDate > now) {
      return NextResponse.json({ error: "This offer is not active yet." }, { status: 400 });
    }

    if (offer.endDate < now) {
      return NextResponse.json({ error: "This offer has expired." }, { status: 400 });
    }

    // 3. Check stock limit (maxPurchases)
    if (offer.maxPurchases !== null && offer.totalSold >= offer.maxPurchases) {
      return NextResponse.json({ error: "Sold out! This offer has reached its purchase limit." }, { status: 400 });
    }

    // 4. Check Per-User Limit
    const userPurchasedCount = await db.giftCard.count({
      where: {
        offerId: offer.id,
        purchasedBy: buyerEmail,
      },
    });

    if (userPurchasedCount >= offer.perUserLimit) {
      return NextResponse.json(
        {
          error: `You have reached the maximum allowed limit of ${offer.perUserLimit} gift card(s) for this offer.`,
        },
        { status: 400 }
      );
    }

    // 5. Generate code LVS-XXXXXXXX
    const code = await generateUniqueCode();
    const targetRecipientEmail = isGift ? recipientEmail.trim().toLowerCase() : buyerEmail;

    // 6. Atomic DB Transaction: Create GiftCard & increment totalSold on GiftCardOffer
    const giftCard = await db.$transaction(async (tx) => {
      // Re-verify stock inside transaction
      const txOffer = await tx.giftCardOffer.findUnique({ where: { id: offer.id } });
      if (txOffer?.maxPurchases !== null && txOffer && txOffer.totalSold >= txOffer.maxPurchases) {
        throw new Error("Sold out! This offer has reached its purchase limit.");
      }

      const created = await tx.giftCard.create({
        data: {
          code,
          value: offer.faceValue,
          balance: offer.faceValue,
          purchasedBy: buyerEmail,
          purchasedAt: new Date(),
          isRedeemed: false,
          isGift: Boolean(isGift),
          senderName: senderName?.trim() || null,
          recipientName: isGift ? recipientName.trim() : null,
          recipientEmail: isGift ? recipientEmail.trim().toLowerCase() : null,
          recipientPhone: isGift && recipientPhone ? recipientPhone.trim() : null,
          personalMessage: personalMessage?.trim() || null,
          sharedVia: sharedVia || "email",
          offerId: offer.id,
        },
      });

      await tx.giftCardOffer.update({
        where: { id: offer.id },
        data: { totalSold: { increment: 1 } },
      });

      return created;
    });

    console.log(`[gift-cards/purchase] Gift card created: ${code} under offer "${offer.name}" for ${targetRecipientEmail}`);

    // 7. Dispatch Emails
    let emailResult = await sendGiftCardEmail({
      recipientEmail: targetRecipientEmail,
      code: giftCard.code,
      value: giftCard.value,
      isGift: giftCard.isGift,
      senderName: giftCard.senderName || undefined,
      recipientName: giftCard.recipientName || undefined,
      personalMessage: giftCard.personalMessage || undefined,
      purchasedBy: buyerEmail,
    });

    // If sent as gift, also send a separate buyer confirmation email
    if (isGift && giftCard.recipientEmail && giftCard.recipientName) {
      sendGiftCardBuyerConfirmationEmail({
        buyerEmail,
        recipientName: giftCard.recipientName,
        recipientEmail: giftCard.recipientEmail,
        code: giftCard.code,
        value: giftCard.value,
      }).catch((e) => console.error("Buyer confirmation email error:", e));
    }

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
        recipientPhone: giftCard.recipientPhone,
        senderName: giftCard.senderName,
        personalMessage: giftCard.personalMessage,
        sharedVia: giftCard.sharedVia,
        offerName: offer.name,
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
