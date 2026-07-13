import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orders = await db.order.findMany({
      include: {
        user: {
          select: { name: true, email: true, phone: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { orderId, action, status, paymentStatus, notes } = body;

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    if (action === "updateStatus") {
      const order = await db.order.update({
        where: { id: orderId },
        data: { status: status as OrderStatus },
      });
      return NextResponse.json({ success: true, data: order });
    }

    if (action === "updatePaymentStatus") {
      const order = await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: paymentStatus as PaymentStatus },
      });
      return NextResponse.json({ success: true, data: order });
    }

    if (action === "updateNotes") {
      const order = await db.order.update({
        where: { id: orderId },
        data: { notes },
      });
      return NextResponse.json({ success: true, data: order });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
