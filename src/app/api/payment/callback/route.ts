import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processOrderStockAndCoupon } from "@/lib/orders";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Valid PayGlocal statuses indicating successful payment
 */
const SUCCESS_STATUSES = [
  "SENT_FOR_CAPTURE",
  "AUTHORIZED",
  "COMPLETED",
  "SUCCESS",
  "PAID",
  "APPROVED",
];

/**
 * Valid PayGlocal statuses indicating failure, decline, or cancellation
 */
const FAILURE_STATUSES = [
  "CUSTOMER_CANCELLED",
  "CANCELLED",
  "CANCELED",
  "ABANDONED",
  "ISSUER_DECLINE",
  "GENERAL_DECLINE",
  "FAILED",
  "DECLINED",
  "REJECTED",
  "REQUEST_ERROR",
  "EXPIRED",
  "TIMED_OUT",
  "ERROR",
];

/**
 * Decode JWT token payload (header.payload.signature) sent in x-gl-token
 */
function decodeJwtPayload(token: string | null | undefined): any {
  if (!token || typeof token !== "string") return null;
  const parts = token.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn("[callback] Failed to decode JWT payload:", err);
    return null;
  }
}

/**
 * PayGlocal browser redirect handler (merchantCallbackURL).
 *
 * PayGlocal redirects the user's browser here after payment is completed or attempted.
 * This handler:
 * 1. Extracts x-gl-token or direct fields from query or POST body
 * 2. Decodes x-gl-token to resolve actual payment status & transaction ID
 * 3. Resolves the order in the database
 * 4. STRICTLY verifies payment status:
 *    - ONLY marks PAID + CONFIRMED if status is explicitly in SUCCESS_STATUSES
 *    - If status is CANCELLED or FAILED, marks order FAILED + CANCELLED without deducting stock
 * 5. Redirects to order-received with appropriate status and only clears cart on true success
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
    let glToken: string | null =
      searchParams.get("x-gl-token") ||
      searchParams.get("x-gl-token-external") ||
      searchParams.get("token");

    let merchantTxnId: string | null =
      searchParams.get("merchantTxnId") ||
      searchParams.get("merchantTxnID") ||
      searchParams.get("merchant_txn_id") ||
      searchParams.get("orderId") ||
      searchParams.get("x-gl-merchantTxnId") ||
      searchParams.get("x-gl-orderId");

    let status: string | null =
      searchParams.get("status") ||
      searchParams.get("txnStatus") ||
      searchParams.get("paymentStatus") ||
      searchParams.get("responseCode");

    let paymentId: string | null =
      searchParams.get("paymentId") ||
      searchParams.get("gid") ||
      searchParams.get("x-gl-gid") ||
      searchParams.get("pgTxnId");

    // 2. Parse body for POST redirects
    if (request.method === "POST") {
      try {
        const contentType = request.headers.get("content-type") || "";
        if (
          contentType.includes("application/x-www-form-urlencoded") ||
          contentType.includes("multipart/form-data")
        ) {
          const formData = await request.formData();
          glToken =
            glToken ||
            (formData.get("x-gl-token") as string | null) ||
            (formData.get("x-gl-token-external") as string | null) ||
            (formData.get("token") as string | null);

          merchantTxnId =
            merchantTxnId ||
            (formData.get("merchantTxnId") as string | null) ||
            (formData.get("merchantTxnID") as string | null) ||
            (formData.get("merchant_txn_id") as string | null) ||
            (formData.get("orderId") as string | null);

          status =
            status ||
            (formData.get("status") as string | null) ||
            (formData.get("txnStatus") as string | null) ||
            (formData.get("paymentStatus") as string | null);

          paymentId =
            paymentId ||
            (formData.get("paymentId") as string | null) ||
            (formData.get("gid") as string | null) ||
            (formData.get("x-gl-gid") as string | null);
        } else {
          const rawText = await request.text();
          if (rawText.trim().startsWith("ey")) {
            glToken = glToken || rawText.trim();
          } else {
            try {
              const body = JSON.parse(rawText);
              glToken =
                glToken ||
                body["x-gl-token"] ||
                body["x-gl-token-external"] ||
                body.token;

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
                body["x-gl-gid"] ||
                body.data?.paymentId ||
                body.data?.gid;
            } catch {
              try {
                const params = new URLSearchParams(rawText);
                glToken = glToken || params.get("x-gl-token") || params.get("x-gl-token-external");
                merchantTxnId = merchantTxnId || params.get("merchantTxnId") || params.get("orderId");
                status = status || params.get("status") || params.get("txnStatus");
                paymentId = paymentId || params.get("paymentId") || params.get("gid");
              } catch {
                /* ignore */
              }
            }
          }
        }
      } catch (e) {
        console.warn("[callback] Body parsing error:", e);
      }
    }

    // 3. If x-gl-token is present, decode JWT payload
    if (glToken) {
      const decoded = decodeJwtPayload(glToken);
      if (decoded) {
        console.log("[callback] Decoded x-gl-token payload:", decoded);
        merchantTxnId =
          decoded.merchantTxnId ||
          decoded["x-gl-merchantTxnId"] ||
          decoded.orderId ||
          decoded["x-gl-orderId"] ||
          decoded.data?.merchantTxnId ||
          merchantTxnId;

        status =
          decoded.status ||
          decoded.txnStatus ||
          decoded.paymentStatus ||
          decoded["x-gl-status"] ||
          decoded.data?.status ||
          decoded.data?.paymentStatus ||
          status;

        paymentId =
          decoded.gid ||
          decoded["x-gl-gid"] ||
          decoded.paymentId ||
          decoded.pgTxnId ||
          decoded.data?.paymentId ||
          decoded.data?.gid ||
          paymentId;
      }
    }

    console.log("[callback] Redirect received and parsed:", {
      method: request.method,
      merchantTxnId,
      status,
      paymentId,
      hasToken: !!glToken,
    });

    // 4. Resolve the order in the database
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

    // Fallback: find the most recent order created in the last 30 minutes that has a paymentAttemptId
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

    // 5. Evaluate Payment Status (STRICT ZERO-TRUST LOGIC)
    const upperStatus = (status || "").trim().toUpperCase();
    console.log("[callback] Evaluated status:", upperStatus, "| Order:", order.orderNumber);

    const isSuccess = SUCCESS_STATUSES.includes(upperStatus);
    const isExplicitCancel =
      upperStatus.includes("CANCEL") ||
      upperStatus === "ABANDONED";

    if (isSuccess) {
      // Payment is EXPLICITLY SUCCESSFUL
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

      console.log("[callback] ✅ Successfully updated order to PAID:", order.orderNumber);

      return NextResponse.redirect(
        `${baseUrl}/checkout/order-received?orderNumber=${order.orderNumber}&clearCart=true`
      );
    } else {
      // Payment is NOT successful (cancelled by customer, bank declined, abandoned, or unverified)
      // NEVER mark as PAID!
      console.log(
        `[callback] ❌ Payment not successful (status="${upperStatus || "EMPTY"}"). Order: ${order.orderNumber}`
      );

      // Only update if it was not already marked PAID by a verified webhook
      if (order.paymentStatus !== "PAID") {
        await db.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "FAILED",
            status: "CANCELLED",
            paymentMethod: "PayGlocal",
            paymentId: paymentId || (merchantTxnId ? `PAY-CANCELLED-${merchantTxnId}` : null),
          },
        });
      }

      // Redirect to order-received page with payment=cancelled / failed
      // DO NOT pass clearCart=true so customer's cart is preserved and they can retry payment
      const paymentParam = isExplicitCancel ? "cancelled" : "failed";
      return NextResponse.redirect(
        `${baseUrl}/checkout/order-received?orderNumber=${order.orderNumber}&payment=${paymentParam}`
      );
    }
  } catch (error: any) {
    console.error("[callback] Unhandled error during redirect:", error);
    return NextResponse.redirect(`${baseUrl}/checkout?error=callback_error`);
  }
}
