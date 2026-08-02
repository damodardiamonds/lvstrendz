import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

// GET: List all coupons
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new coupon
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      code,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      isActive,
      startsAt,
      expiresAt,
    } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { error: "Code, type, and value are required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    // Check code uniqueness
    const existing = await db.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 400 }
      );
    }

    const coupon = await db.coupon.create({
      data: {
        code: cleanCode,
        type: type === "FIXED" ? "FIXED" : "PERCENTAGE",
        value: Number(value),
        minOrderValue: minOrderValue !== null && minOrderValue !== undefined && minOrderValue !== "" ? Number(minOrderValue) : null,
        maxDiscount: maxDiscount !== null && maxDiscount !== undefined && maxDiscount !== "" ? Number(maxDiscount) : null,
        usageLimit: usageLimit !== null && usageLimit !== undefined && usageLimit !== "" ? Number(usageLimit) : null,
        isActive: isActive ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update an existing coupon or toggle status
export async function PUT(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, code, type, value, minOrderValue, maxDiscount, usageLimit, isActive, startsAt, expiresAt } = body;

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code.trim().toUpperCase();
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = Number(value);
    if (minOrderValue !== undefined) updateData.minOrderValue = minOrderValue ? Number(minOrderValue) : null;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? Number(usageLimit) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const coupon = await db.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a coupon
export async function DELETE(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Coupon ID is required" }, { status: 400 });
    }

    await db.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
