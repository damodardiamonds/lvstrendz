import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

// GET: Return all gift cards purchased under a specific offer
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const giftCards = await db.giftCard.findMany({
      where: { offerId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, giftCards });
  } catch (error: any) {
    console.error("GET offer purchases error:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch purchases" }, { status: 500 });
  }
}
