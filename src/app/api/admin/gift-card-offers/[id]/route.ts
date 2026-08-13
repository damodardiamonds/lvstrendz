import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

// PUT: Update an existing gift card offer
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    const {
      name,
      faceValue,
      sellingPrice,
      startDate,
      endDate,
      maxPurchases,
      perUserLimit,
      description,
      isActive,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (faceValue !== undefined) updateData.faceValue = Number(faceValue);
    if (sellingPrice !== undefined) updateData.sellingPrice = Number(sellingPrice);
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (maxPurchases !== undefined) updateData.maxPurchases = maxPurchases ? Number(maxPurchases) : null;
    if (perUserLimit !== undefined) updateData.perUserLimit = Number(perUserLimit);
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const offer = await db.giftCardOffer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, offer });
  } catch (error: any) {
    console.error("PUT /api/admin/gift-card-offers/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to update offer" }, { status: 500 });
  }
}

// DELETE: Delete an offer (or disable if gift cards already sold)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const offer = await db.giftCardOffer.findUnique({
      where: { id },
      include: { _count: { select: { giftCards: true } } },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if (offer._count.giftCards > 0) {
      // Soft disable if cards have been purchased under this offer
      await db.giftCardOffer.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        message: "Offer deactivated as gift cards have already been purchased.",
      });
    }

    await db.giftCardOffer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/gift-card-offers/[id] error:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete offer" }, { status: 500 });
  }
}
