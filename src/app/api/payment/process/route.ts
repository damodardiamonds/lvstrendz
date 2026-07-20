import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processOrderStockAndCoupon } from "@/lib/orders";

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentMethod, paymentDetails } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing required orderId" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const timestamp = Date.now();
    let txnId = `PAY-${timestamp}`;
    let formattedMethod = paymentMethod || "Online Gateway";

    if (paymentMethod === "CARD" || paymentMethod === "Credit / Debit Card") {
      const cardBrand = paymentDetails?.cardBrand || "Card";
      const last4 = paymentDetails?.cardNumber ? paymentDetails.cardNumber.slice(-4) : "****";
      formattedMethod = `Credit/Debit Card (${cardBrand} ending ${last4})`;
      txnId = `TXN_CARD_${timestamp}_${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (paymentMethod === "UPI" || paymentMethod === "UPI / Instant QR") {
      const upiId = paymentDetails?.upiId || "Instant QR Scan";
      formattedMethod = `UPI (${upiId})`;
      txnId = `TXN_UPI_${timestamp}_${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (paymentMethod === "NETBANKING" || paymentMethod === "Net Banking") {
      const bankName = paymentDetails?.bankName || "Net Banking";
      formattedMethod = `Net Banking (${bankName})`;
      txnId = `TXN_NB_${timestamp}_${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (paymentMethod === "PAYGLOCAL") {
      formattedMethod = "PayGlocal Online Gateway";
      txnId = `TXN_PGL_${timestamp}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Update Order Payment Status
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        paymentMethod: formattedMethod,
        paymentId: txnId,
      },
    });

    // Deduct Stock and Increment Coupon usage
    await processOrderStockAndCoupon(orderId);

    return NextResponse.json({
      success: true,
      orderNumber: updatedOrder.orderNumber,
      paymentStatus: "PAID",
      paymentMethod: formattedMethod,
    });
  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payment." },
      { status: 500 }
    );
  }
}
