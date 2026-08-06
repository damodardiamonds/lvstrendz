import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { processOrderStockAndCoupon } from "@/lib/orders";

/**
 * PayGlocal server-to-server webhook.
 *
 * Register this URL in the PayGlocal merchant portal as your webhook/notification endpoint:
 *   https://lvstrendz.com/api/payment/webhook
 *
 * This is the ONLY place that:
 *  - Updates order paymentStatus (PAID / FAILED)
 *  - Updates order status (CONFIRMED / CANCELLED)
 *  - Runs stock deduction and coupon usage tracking
 *  - Triggers order dispatching pipeline
 *
 * The browser callback (/api/payment/callback) only redirects the user —
 * it does NOT write to the database.
 *
 * Always returns HTTP 200 so PayGlocal stops retrying regardless of outcome.
 */

const PROD_API_URL = "https://api.prod.payglocal.in";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const rawBody = await request.text();

    console.log("[webhook] Incoming POST | Content-Type:", contentType);
    console.log("[webhook] Raw body:", rawBody);

    // ── 1. Parse incoming webhook payload ────────────────────────────────────
    let merchantTxnId: string | null = null;
    let paymentId: string | null = null;
    let incomingStatus: string | null = null;

    if (contentType.includes("application/json")) {
      try {
        const body = JSON.parse(rawBody);
        merchantTxnId = body.merchantTxnId ?? body.data?.merchantTxnId ?? null;
        paymentId     = body.paymentId     ?? body.data?.paymentId     ?? null;
        incomingStatus = body.status       ?? body.data?.status        ?? null;
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
      merchantTxnId  = formData.get("merchantTxnId") as string | null;
      paymentId      = formData.get("paymentId")     as string | null;
      incomingStatus = formData.get("status")        as string | null;
    } else {
      // Plain text or unknown — also check query params
      const { searchParams } = new URL(request.url);
      merchantTxnId  = searchParams.get("merchantTxnId");
      paymentId      = searchParams.get("paymentId");
      incomingStatus = searchParams.get("status");

      // Last attempt: try raw body as JSON
      if (!merchantTxnId) {
        try {
          const body = JSON.parse(rawBody);
          merchantTxnId  = body.merchantTxnId ?? body.data?.merchantTxnId ?? null;
          paymentId      = body.paymentId     ?? body.data?.paymentId     ?? null;
          incomingStatus = body.status        ?? body.data?.status        ?? null;
        } catch { /* ignore */ }
      }
    }

    console.log("[webhook] Parsed:", { merchantTxnId, paymentId, incomingStatus });

    if (!merchantTxnId) {
      console.error("[webhook] Cannot identify transaction — missing merchantTxnId");
      return NextResponse.json({ received: true, error: "missing_merchantTxnId" }, { status: 200 });
    }

    // ── 2. Idempotency — skip if already finalized ───────────────────────────
    // merchantTxnId is now "orderNumber-epochSeconds" format.
    // Look up by paymentAttemptId first, then fall back to plain orderNumber.
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

    // ── 4. Server-side status verification with PayGlocal ───────────────────
    let verifiedStatus = (incomingStatus ?? "").toUpperCase();

    if (publicKey && privateKey) {
      try {
        const { generateJWEAndJWS } = require("payglocal-js-client");

        const secureTokens = await generateJWEAndJWS({
          payload: { merchantTxnId, paymentId },
          publicKey,
          privateKey,
          merchantId:   process.env.PAYGLOCAL_MERCHANT_ID   || "ptplkikanikr2907",
          publicKeyId:  process.env.PAYGLOCAL_PUBLIC_KEY_ID  || "8cc91c8d-8030-4660-a9c7-33de886fb495",
          privateKeyId: process.env.PAYGLOCAL_PRIVATE_KEY_ID || "kId-edUmioEvV6nLsG6l",
        });

        const statusUrl = `${PROD_API_URL}/gl/v1/payments/${merchantTxnId}/status`;
        console.log("[webhook] Verifying status at:", statusUrl);

        const verifyRes = await fetch(statusUrl, {
          method: "GET",
          headers: {
            "Content-Type": "text/plain",
            "x-gl-token-external": secureTokens.jwsToken,
          },
        });

        const verifyData = await verifyRes.json();
        console.log("[webhook] PayGlocal status response:", JSON.stringify(verifyData));

        if (verifyRes.ok) {
          const fromApi = (
            verifyData.status            ??
            verifyData.data?.status      ??
            verifyData.data?.paymentStatus ??
            ""
          ).toString().toUpperCase();

          if (fromApi) {
            verifiedStatus = fromApi;
            console.log("[webhook] Server-verified status:", verifiedStatus);
          }
        } else {
          console.warn("[webhook] Status API returned non-OK, using incoming status:", incomingStatus);
        }
      } catch (verifyErr) {
        console.error("[webhook] Status verification failed, using incoming status:", verifyErr);
      }
    } else {
      console.warn("[webhook] PEM keys unavailable — trusting incoming status without verification");
    }

    // ── 5. Update database and trigger dispatch pipeline ─────────────────────
    if (["APPROVED", "SUCCESS", "PAID"].includes(verifiedStatus)) {

      // Update order → PAID + CONFIRMED
      await db.order.update({
        where: { orderNumber: merchantTxnId },
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

      // ── Dispatch pipeline hooks ──────────────────────────────────────────
      // TODO: Send order confirmation email to customer
      // await sendOrderConfirmationEmail(order);

      // TODO: Notify admin / fulfilment team
      // await notifyAdminNewOrder(order);

      // TODO: Trigger shipping label generation
      // await createShipmentLabel(order);

    } else if (["FAILED", "DECLINED", "CANCELLED", "REJECTED"].includes(verifiedStatus)) {

      await db.order.update({
        where: { orderNumber: merchantTxnId },
        data: {
          paymentStatus: "FAILED",
          status:        "CANCELLED",
          paymentMethod: "PayGlocal",
          paymentId:     paymentId || `PAY-FAILED-${Date.now()}`,
        },
      });

      console.log("[webhook] ❌ Order marked FAILED + CANCELLED:", merchantTxnId);

    } else {
      // INPROGRESS or unknown — non-terminal, wait for the next webhook call
      console.log("[webhook] ⏳ Non-terminal status, no DB update:", verifiedStatus, "| Order:", merchantTxnId);
    }

    // Always 200 so PayGlocal does not retry
    return NextResponse.json({ received: true, status: verifiedStatus }, { status: 200 });

  } catch (error: any) {
    console.error("[webhook] Unhandled error:", error);
    return NextResponse.json({ received: true, error: "internal_error" }, { status: 200 });
  }
}
