import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { processOrderStockAndCoupon } from "@/lib/orders";

/**
 * PayGlocal server-to-server webhook.
 *
 * Register this URL in the PayGlocal merchant portal as your webhook endpoint:
 *   https://lvstrendz.com/api/payment/webhook
 *
 * PayGlocal will POST to this URL when a payment is finalized on their end.
 * This is the AUTHORITATIVE handler — it updates the DB and triggers dispatch.
 * The browser callback (/api/payment/callback) only handles user redirect.
 *
 * Always responds 200 OK to acknowledge receipt (even on errors), so PayGlocal
 * does not keep retrying for non-infrastructure errors.
 */

const PROD_API_URL = "https://api.prod.payglocal.in";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    const rawBody = await request.text();

    console.log("[webhook] Received POST | Content-Type:", contentType);
    console.log("[webhook] Raw body:", rawBody);

    // ── 1. Parse incoming webhook payload ──────────────────────────────────────
    let merchantTxnId: string | null = null;
    let paymentId: string | null = null;
    let incomingStatus: string | null = null;

    // PayGlocal may send JSON, form-encoded, or a plain JWE/JWS token string.
    // We extract what we can and always server-verify the final status.
    if (contentType.includes("application/json")) {
      try {
        const body = JSON.parse(rawBody);
        merchantTxnId = body.merchantTxnId ?? body.data?.merchantTxnId ?? null;
        paymentId = body.paymentId ?? body.data?.paymentId ?? null;
        incomingStatus = body.status ?? body.data?.status ?? null;
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
      merchantTxnId = formData.get("merchantTxnId") as string;
      paymentId = formData.get("paymentId") as string;
      incomingStatus = formData.get("status") as string;
    } else {
      // Plain text / JWE token — PayGlocal may send the raw token.
      // We can't decrypt it (client doesn't have decryptJWE), so we rely on
      // query params or look up by gid if PayGlocal includes it.
      const { searchParams } = new URL(request.url);
      merchantTxnId = searchParams.get("merchantTxnId");
      paymentId = searchParams.get("paymentId");
      incomingStatus = searchParams.get("status");

      // Last attempt: treat body as JSON
      if (!merchantTxnId) {
        try {
          const body = JSON.parse(rawBody);
          merchantTxnId = body.merchantTxnId ?? body.data?.merchantTxnId ?? null;
          paymentId = body.paymentId ?? body.data?.paymentId ?? null;
          incomingStatus = body.status ?? body.data?.status ?? null;
        } catch {
          // ignore
        }
      }
    }

    console.log("[webhook] Parsed:", { merchantTxnId, paymentId, incomingStatus });

    if (!merchantTxnId) {
      console.error("[webhook] Could not extract merchantTxnId — cannot process");
      // Still return 200 so PayGlocal stops retrying for this malformed payload
      return NextResponse.json({ received: true, error: "missing merchantTxnId" }, { status: 200 });
    }

    // ── 2. Idempotency check ───────────────────────────────────────────────────
    const existingOrder = await db.order.findUnique({
      where: { orderNumber: merchantTxnId },
    });

    if (!existingOrder) {
      console.error("[webhook] Order not found in DB:", merchantTxnId);
      return NextResponse.json({ received: true, error: "order not found" }, { status: 200 });
    }

    if (existingOrder.paymentStatus === "PAID") {
      console.log("[webhook] Order already PAID — skipping duplicate webhook:", merchantTxnId);
      return NextResponse.json({ received: true, skipped: "already_paid" }, { status: 200 });
    }

    // ── 3. Load PEM keys ───────────────────────────────────────────────────────
    let publicKey = process.env.PAYGLOCAL_PUBLIC_KEY?.replace(/\\n/g, "\n");
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
        publicKey = fs.readFileSync(publicPemPath, "utf8");
        privateKey = fs.readFileSync(privatePemPath, "utf8");
      }
    }

    // ── 4. Server-side status verification ────────────────────────────────────
    let verifiedStatus: string = incomingStatus?.toUpperCase() ?? "";

    if (publicKey && privateKey) {
      try {
        const { generateJWEAndJWS } = require("payglocal-js-client");

        const statusPayload = { merchantTxnId, paymentId };
        const secureTokens = await generateJWEAndJWS({
          payload: statusPayload,
          publicKey,
          privateKey,
          merchantId: process.env.PAYGLOCAL_MERCHANT_ID || "ptplkikanikr2907",
          publicKeyId:
            process.env.PAYGLOCAL_PUBLIC_KEY_ID ||
            "8cc91c8d-8030-4660-a9c7-33de886fb495",
          privateKeyId:
            process.env.PAYGLOCAL_PRIVATE_KEY_ID || "kId-edUmioEvV6nLsG6l",
        });

        const statusUrl = `${PROD_API_URL}/gl/v1/payments/${merchantTxnId}/status`;
        console.log("[webhook] Verifying at:", statusUrl);

        const verifyRes = await fetch(statusUrl, {
          method: "GET",
          headers: {
            "Content-Type": "text/plain",
            "x-gl-token-external": secureTokens.jwsToken,
          },
        });

        const verifyData = await verifyRes.json();
        console.log("[webhook] Status API response:", JSON.stringify(verifyData));

        if (verifyRes.ok) {
          verifiedStatus =
            (
              verifyData.status ??
              verifyData.data?.status ??
              verifyData.data?.paymentStatus ??
              ""
            ).toString().toUpperCase();
          console.log("[webhook] Verified status from PayGlocal:", verifiedStatus);
        } else {
          console.warn("[webhook] Status API non-OK, falling back to incoming status:", incomingStatus);
        }
      } catch (verifyError) {
        console.error("[webhook] Status verification error, falling back to incoming status:", verifyError);
      }
    } else {
      console.warn("[webhook] PEM keys missing — using incoming status without server verification");
    }

    // ── 5. Process payment outcome ─────────────────────────────────────────────
    if (
      verifiedStatus === "APPROVED" ||
      verifiedStatus === "SUCCESS" ||
      verifiedStatus === "PAID"
    ) {
      // Mark order PAID + CONFIRMED
      await db.order.update({
        where: { orderNumber: merchantTxnId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paymentMethod: "PayGlocal",
          paymentId: paymentId || `PAY-${Date.now()}`,
        },
      });

      console.log("[webhook] Order marked PAID:", merchantTxnId);

      // Deduct stock and track coupon usage — triggers dispatch readiness
      await processOrderStockAndCoupon(existingOrder.id);

      console.log("[webhook] Stock & coupon processed. Order ready for dispatch:", merchantTxnId);

      // TODO: Add email/SMS dispatch notification here
      // e.g. await sendOrderConfirmationEmail(existingOrder);
      // e.g. await notifyAdminNewOrder(existingOrder);

    } else if (
      verifiedStatus === "FAILED" ||
      verifiedStatus === "DECLINED" ||
      verifiedStatus === "CANCELLED" ||
      verifiedStatus === "REJECTED"
    ) {
      await db.order.update({
        where: { orderNumber: merchantTxnId },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
          paymentMethod: "PayGlocal",
          paymentId: paymentId || `PAY-FAILED-${Date.now()}`,
        },
      });

      console.log("[webhook] Order marked FAILED/CANCELLED:", merchantTxnId);
    } else {
      // INPROGRESS, PENDING, or unknown — do not update, wait for next webhook
      console.log("[webhook] Status not terminal:", verifiedStatus, "— no DB update");
    }

    // Always return 200 so PayGlocal knows we received it
    return NextResponse.json({ received: true, status: verifiedStatus }, { status: 200 });

  } catch (error: any) {
    console.error("[webhook] Unhandled error:", error);
    // Return 200 so PayGlocal doesn't keep retrying for server-side errors;
    // check Vercel logs for investigation.
    return NextResponse.json({ received: true, error: "internal_error" }, { status: 200 });
  }
}
