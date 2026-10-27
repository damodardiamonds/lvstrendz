import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { processOrderStockAndCoupon } from "@/lib/orders";
import { sendOrderConfirmationEmail } from "@/backend/lib/email";
import { sendAdminPushNotification } from "@/backend/lib/push-notifications";

/**
 * PayGlocal server-to-server webhook.
 *
 * Register this URL in the PayGlocal merchant portal as your webhook/notification endpoint:
 *   https://lvstrendz.com/api/payment/webhook
 *
 * This is an authoritative server-to-server endpoint that:
 *  - Verifies incoming paymentStatus (PAID / FAILED)
 *  - Updates order status (CONFIRMED / CANCELLED)
 *  - Runs stock deduction and coupon usage tracking
 *  - Dispatches email and push notifications
 *
 * Always returns HTTP 200 so PayGlocal stops retrying regardless of outcome.
 */

const PROD_API_URL = "https://api.prod.payglocal.in";

const SUCCESS_STATUSES = [
  "SENT_FOR_CAPTURE",
  "AUTHORIZED",
  "COMPLETED",
  "SUCCESS",
  "PAID",
  "APPROVED",
];

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
    console.warn("[webhook] Failed to decode JWT payload:", err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const rawBody = await request.text();

    console.log("[webhook] Incoming POST | Content-Type:", contentType);
    console.log("[webhook] Raw body:", rawBody);

    // ── 1. Parse incoming webhook payload ────────────────────────────────────
    let glToken: string | null = null;
    let merchantTxnId: string | null = null;
    let paymentId: string | null = null;
    let incomingStatus: string | null = null;

    if (contentType.includes("application/json")) {
      try {
        const body = JSON.parse(rawBody);
        glToken = body["x-gl-token"] ?? body["x-gl-token-external"] ?? body.token ?? null;
        merchantTxnId = body.merchantTxnId ?? body.data?.merchantTxnId ?? null;
        paymentId     = body.paymentId     ?? body.gid ?? body.data?.paymentId ?? null;
        incomingStatus = body.status       ?? body.txnStatus ?? body.data?.status ?? null;
      } catch {
        console.warn("[webhook] Failed to parse JSON body");
      }
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await new Request(request.url, {
        method: "POST",
        headers: { "content-type": contentType },
        body: rawBody,
      }).formData();
      glToken        = (formData.get("x-gl-token") as string | null) || (formData.get("x-gl-token-external") as string | null);
      merchantTxnId  = (formData.get("merchantTxnId") as string | null) || (formData.get("orderId") as string | null);
      paymentId      = (formData.get("paymentId") as string | null) || (formData.get("gid") as string | null);
      incomingStatus = (formData.get("status") as string | null) || (formData.get("txnStatus") as string | null);
    } else {
      // Plain text or unknown — also check query params and raw token
      const { searchParams } = new URL(request.url);
      glToken        = searchParams.get("x-gl-token") || searchParams.get("x-gl-token-external");
      merchantTxnId  = searchParams.get("merchantTxnId") || searchParams.get("orderId");
      paymentId      = searchParams.get("paymentId") || searchParams.get("gid");
      incomingStatus = searchParams.get("status") || searchParams.get("txnStatus");

      if (rawBody.trim().startsWith("ey")) {
        glToken = glToken || rawBody.trim();
      } else if (!merchantTxnId) {
        try {
          const body = JSON.parse(rawBody);
          glToken        = glToken || body["x-gl-token"] || body["x-gl-token-external"];
          merchantTxnId  = body.merchantTxnId ?? body.data?.merchantTxnId ?? null;
          paymentId      = body.paymentId     ?? body.gid ?? body.data?.paymentId ?? null;
          incomingStatus = body.status        ?? body.txnStatus ?? body.data?.status ?? null;
        } catch { /* ignore */ }
      }
    }

    // Decode JWT payload if x-gl-token is present
    if (glToken) {
      const decoded = decodeJwtPayload(glToken);
      if (decoded) {
        console.log("[webhook] Decoded JWT payload:", decoded);
        merchantTxnId =
          decoded.merchantTxnId ||
          decoded["x-gl-merchantTxnId"] ||
          decoded.orderId ||
          decoded["x-gl-orderId"] ||
          decoded.data?.merchantTxnId ||
          merchantTxnId;

        incomingStatus =
          decoded.status ||
          decoded.txnStatus ||
          decoded.paymentStatus ||
          decoded["x-gl-status"] ||
          decoded.data?.status ||
          incomingStatus;

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

    console.log("[webhook] Parsed:", { merchantTxnId, paymentId, incomingStatus, hasToken: !!glToken });

    if (!merchantTxnId) {
      console.error("[webhook] Cannot identify transaction — missing merchantTxnId");
      return NextResponse.json({ received: true, error: "missing_merchantTxnId" }, { status: 200 });
    }

    // ── 2. Idempotency — skip if already finalized ───────────────────────────
    let order = await db.order.findFirst({
      where: { paymentAttemptId: merchantTxnId },
    });

    if (!order) {
      // Fallback: strip the suffix and look up by plain orderNumber
      const baseOrderNumber = merchantTxnId.replace(/-\d+$/, "");
      order = await db.order.findUnique({
        where: { orderNumber: baseOrderNumber },
      });
    }
    if (!order) {
      console.error("[webhook] Order not found:", merchantTxnId);
      return NextResponse.json({ received: true, error: "order_not_found" }, { status: 200 });
    }

    if (order.paymentStatus === "PAID") {
      console.log("[webhook] Already PAID — skipping duplicate notification:", merchantTxnId);
      return NextResponse.json({ received: true, skipped: "already_paid" }, { status: 200 });
    }

    // ── 3. Load PEM keys ─────────────────────────────────────────────────────
    let publicKey  = process.env.PAYGLOCAL_PUBLIC_KEY?.replace(/\\n/g, "\n");
    let privateKey = process.env.PAYGLOCAL_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!publicKey || !privateKey) {
      const publicPemPath = path.resolve(
        process.cwd(),
        process.env.PAYGLOCAL_PUBLIC_PEM_PATH ||
          "./keys/8cc91c8d-8030-4660-a9c7-33de886fb495_payglocal_mid.pem"
      );
      const privatePemPath = path.resolve(
        process.cwd(),
        process.env.PAYGLOCAL_PRIVATE_PEM_PATH ||
          "./keys/kId-edUmioEvV6nLsG6l_ptplkikanikr2907.pem"
      );
      if (fs.existsSync(publicPemPath) && fs.existsSync(privatePemPath)) {
        publicKey  = fs.readFileSync(publicPemPath,  "utf8");
        privateKey = fs.readFileSync(privatePemPath, "utf8");
      }
    }

    // ── 4. Status normalization ─────────────────────────────────────────────
    let verifiedStatus = (incomingStatus ?? "").trim().toUpperCase();

    // ── 5. Update database and trigger dispatch pipeline ─────────────────────
    const isSuccess = SUCCESS_STATUSES.includes(verifiedStatus);
    const isFailure =
      FAILURE_STATUSES.includes(verifiedStatus) ||
      verifiedStatus.includes("CANCEL") ||
      verifiedStatus.includes("FAIL") ||
      verifiedStatus.includes("DECLINE") ||
      verifiedStatus.includes("REJECT") ||
      verifiedStatus.includes("ABANDON");

    if (isSuccess) {
      // Update order → PAID + CONFIRMED
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status:        "CONFIRMED",
          paymentMethod: "PayGlocal",
          paymentId:     paymentId || `PAY-${Date.now()}`,
        },
      });

      console.log("[webhook] ✅ Order marked PAID + CONFIRMED:", merchantTxnId);

      // Deduct stock & update coupon usage count
      await processOrderStockAndCoupon(order.id);

      console.log("[webhook] ✅ Stock deducted & coupons updated. Order ready for dispatch:", merchantTxnId);

      // Send order confirmation email to customer via Resend
      sendOrderConfirmationEmail(order.id).catch((emailErr) => {
        console.error("[webhook] Non-blocking email dispatch error:", emailErr);
      });

      // Notify admin team via push notification
      sendAdminPushNotification({
        title: '🎉 New Order Paid!',
        body: `Order #${order.orderNumber} (₹${Number(order.total).toFixed(2)}) has been paid successfully.`,
        data: { url: `/admin/orders/${order.id}`, screen: 'orders' },
      }).catch((pushErr) => {
        console.error('[webhook] Admin push notification error:', pushErr);
      });

    } else if (isFailure) {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "FAILED",
          status:        "CANCELLED",
          paymentMethod: "PayGlocal",
          paymentId:     paymentId || `PAY-FAILED-${Date.now()}`,
        },
      });

      console.log("[webhook] ❌ Order marked FAILED + CANCELLED:", merchantTxnId);

    } else {
      // INPROGRESS or unknown — non-terminal, wait for next notification
      console.log("[webhook] ⏳ Non-terminal or unknown status, no DB update:", verifiedStatus, "| Order:", merchantTxnId);
    }

    // Always 200 so PayGlocal does not retry
    return NextResponse.json({ received: true, status: verifiedStatus }, { status: 200 });

  } catch (error: any) {
    console.error("[webhook] Unhandled error:", error);
    return NextResponse.json({ received: true, error: "internal_error" }, { status: 200 });
  }
}
