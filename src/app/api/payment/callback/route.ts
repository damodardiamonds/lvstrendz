import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processOrderStockAndCoupon } from "@/backend/lib/orders";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * PayGlocal browser redirect handler (merchantCallbackURL).
 *
 * PayGlocal redirects the user's browser here after payment is completed or attempted.
 * This handler:
 * 1. Resolves the order by merchantTxnId, attempt ID, or recent order fallback
 * 2. Updates order paymentStatus & status in DB and deducts stock / increments coupon usage
 * 3. Redirects to /checkout/order-received?orderNumber=...&clearCart=true
 */
export async function GET(request: NextRequest) {
  return handleRedirect(request);
}

export async function POST(request: NextRequest) {
  return handleRedirect(request);
}

async function handleRedirect(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Extract potential parameters from query string
    let merchantTxnId =
      searchParams.get("merchantTxnId") ||
      searchParams.get("merchantTxnID") ||
      searchParams.get("merchant_txn_id") ||
      searchParams.get("orderId") ||
      searchParams.get("x-gl-merchantTxnId");

    let status =
      searchParams.get("status") ||
      searchParams.get("txnStatus") ||
      searchParams.get("paymentStatus") ||
      searchParams.get("responseCode");

    let paymentId =
      searchParams.get("paymentId") ||
      searchParams.get("gid") ||
      searchParams.get("pgTxnId");

    // 2. Parse body for POST redirects
    if (request.method === "POST") {
      try {
        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          merchantTxnId =
            merchantTxnId ||
            (formData.get("merchantTxnId") as string) ||
            (formData.get("merchantTxnID") as string) ||
            (formData.get("merchant_txn_id") as string) ||
            (formData.get("orderId") as string);
          status =
            status ||
            (formData.get("status") as string) ||
            (formData.get("txnStatus") as string) ||
            (formData.get("paymentStatus") as string);
          paymentId =
            paymentId ||
            (formData.get("paymentId") as string) ||
            (formData.get("gid") as string);
        } else {
          const text = await request.text();
          try {
            const body = JSON.parse(text);
            merchantTxnId =
              merchantTxnId ||
              body.merchantTxnId ||
              body.merchantTxnID ||
              body.merchant_txn_id ||
              body.orderId ||
              body.data?.merchantTxnId;
            status =
              status ||
              body.status ||
              body.txnStatus ||
              body.paymentStatus ||
              body.data?.status;
            paymentId =
              paymentId ||
              body.paymentId ||
              body.gid ||
              body.data?.paymentId;
          } catch { /* ignore JSON parse error */ }
        }
      } catch (e) {
        console.warn("[callback] Body parsing error:", e);
      }
    }

    console.log("[callback] Redirect received:", {
      method: request.method,
      url: request.url,
      merchantTxnId,
      status,
      paymentId,
    });

    // 3. Fallback resolution if merchantTxnId is missing
    let order = null;

    if (merchantTxnId) {
      // First try finding by paymentAttemptId
      order = await db.order.findFirst({
        where: { paymentAttemptId: merchantTxnId },
      });

      if (!order) {
        // Strip epoch suffix if present (e.g. LVS-123456-1786000000 -> LVS-123456)
        const baseOrderNumber = merchantTxnId.replace(/-\d+$/, "");
        order = await db.order.findUnique({
          where: { orderNumber: baseOrderNumber },
        });
      }
    }

    if (!order && paymentId) {
      order = await db.order.findFirst({
        where: { paymentAttemptId: paymentId },
      });
    }

    // Ultimate fallback: find the most recent order created in the last 30 minutes that has a paymentAttemptId
    if (!order) {
      order = await db.order.findFirst({
        where: {
          paymentAttemptId: { not: null },
          createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        orderBy: { createdAt: "desc" },
      });

      if (order) {
        console.log("[callback] Resolved recent order via 30m fallback:", order.orderNumber);
      }
    }

    if (!order) {
      console.error("[callback] Could not resolve order for redirect");
      return NextResponse.redirect(`${baseUrl}/checkout?error=invalid_callback`);
    }

    const upperStatus = (status || "").toUpperCase();
    const isExplicitFailure = ["FAILED", "DECLINED", "CANCELLED", "REJECTED"].includes(upperStatus);

    if (!isExplicitFailure) {
      // Mark order as PAID + CONFIRMED in DB
      if (order.paymentStatus !== "PAID") {
        await db.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            paymentMethod: "PayGlocal",
            paymentId: paymentId || merchantTxnId || `PAY-${Date.now()}`,
          },
        });

        // Deduct stock & increment coupon usage
        try {
          await processOrderStockAndCoupon(order.id);
        } catch (stkErr) {
          console.error("[callback] Error processing stock/coupon:", stkErr);
        }
      }

      console.log("[callback] Successfully updated order to PAID:", order.orderNumber);

      return NextResponse.redirect(
        `${baseUrl}/checkout/order-received?orderNumber=${order.orderNumber}&clearCart=true`
      );
    } else {
      // Payment failed/declined
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
        },
      });

      return NextResponse.redirect(
        `${baseUrl}/checkout?error=payment_declined&orderNumber=${order.orderNumber}`
      );
    }

  } catch (error: any) {
    console.error("[callback] Unhandled error during redirect:", error);
    return NextResponse.redirect(`${baseUrl}/checkout?error=callback_error`);
  }
}
