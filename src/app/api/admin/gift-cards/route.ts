import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

// GET: List all gift cards
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const giftCards = await db.giftCard.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, giftCards });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new gift card
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, initialValue, balance, isActive, expiresAt } = body;

    if (!code || initialValue === undefined) {
      return NextResponse.json(
        { error: "Code and initial value are required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check code uniqueness
    const existing = await db.giftCard.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A gift card with this code already exists" },
        { status: 400 }
      );
    }

    const initVal = Number(initialValue);
    const balVal = balance !== undefined && balance !== null ? Number(balance) : initVal;

    const giftCard = await db.giftCard.create({
      data: {
        code: cleanCode,
        initialValue: initVal,
        balance: balVal,
        isActive: isActive ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, giftCard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing gift card or toggle status
export async function PUT(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, code, initialValue, balance, isActive, expiresAt } = body;

    if (!id) {
      return NextResponse.json({ error: "Gift card ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (initialValue !== undefined) updateData.initialValue = Number(initialValue);
    if (balance !== undefined) updateData.balance = Number(balance);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const giftCard = await db.giftCard.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, giftCard });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a gift card
export async function DELETE(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Gift card ID is required" }, { status: 400 });
    }

    await db.giftCard.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
