import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

// PATCH: Quick toggle active status
export async function PATCH(
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
    });

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const updated = await db.giftCardOffer.update({
      where: { id },
      data: { isActive: !offer.isActive },
    });

    return NextResponse.json({ success: true, isActive: updated.isActive, offer: updated });
  } catch (error: any) {
    console.error("PATCH toggle offer error:", error);
    return NextResponse.json({ error: error?.message || "Failed to toggle offer status" }, { status: 500 });
  }
}
