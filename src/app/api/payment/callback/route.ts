import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { processOrderStockAndCoupon } from "@/lib/orders";

const PROD_API_URL = "https://api.prod.payglocal.in";

// Browser-facing redirect handler — called when PayGlocal redirects the user's browser back
export async function POST(request: NextRequest) {
  return handleCallback(request);
}

export async function GET(request: NextRequest) {
  return handleCallback(request);
}

async function handleCallback(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    let merchantTxnId: string | null = null;
    let paymentId: string | null = null;
    let status: string | null = null;

    // 1. Extract parameters from query string (GET) or request body (POST)
    if (request.method === "GET") {
      const { searchParams } = new URL(request.url);
      merchantTxnId = searchParams.get("merchantTxnId");
      paymentId = searchParams.get("paymentId");
      status = searchParams.get("status");
    } else {
      const contentType = request.headers.get("content-type") || "";
      if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const formData = await request.formData();
        merchantTxnId = formData.get("merchantTxnId") as string;
        paymentId = formData.get("paymentId") as string;
        status = formData.get("status") as string;
      } else if (contentType.includes("application/json")) {
        const body = await request.json();
        merchantTxnId = body.merchantTxnId;
        paymentId = body.paymentId;
        status = body.status;
      } else {
        // Plain text or unknown — try raw text
        const raw = await request.text();
        console.log("[callback] Raw POST body:", raw);
        try {
          const body = JSON.parse(raw);
          merchantTxnId = body.merchantTxnId;
          paymentId = body.paymentId;
          status = body.status;
        } catch {
          // ignore parse error
        }
      }
    }

    console.log("[callback] Received:", { merchantTxnId, paymentId, status });

    if (!merchantTxnId) {
      console.error("[callback] Missing merchantTxnId");
      return NextResponse.redirect(`${baseUrl}/checkout?error=invalid_callback`);
    }

    // 2. Load PEM keys
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

    if (!publicKey || !privateKey) {
      console.error("[callback] PEM keys missing — redirecting for manual review");
      await db.order.update({
        where: { orderNumber: merchantTxnId },
        data: {
          paymentStatus: "UNPAID",
          paymentMethod: "PayGlocal",
          paymentId: paymentId || "MISSING_KEYS_MANUAL_VERIFY",
        },
      });
      return NextResponse.redirect(
        `${baseUrl}/checkout/order-received?orderNumber=${merchantTxnId}&pending_verification=true`
      );
    }

    // 3. Server-to-server status verification with PayGlocal
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
    console.log("[callback] Verifying status at:", statusUrl);

    const verifyRes = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Content-Type": "text/plain",
        "x-gl-token-external": secureTokens.jwsToken,
      },
    });

    const verifyData = await verifyRes.json();
    console.log("[callback] Status verification response:", JSON.stringify(verifyData));

    if (!verifyRes.ok) {
      console.error("[callback] Status API failed:", verifyData);
      // Fallback: trust the status param sent by PayGlocal redirect
      if (status?.toUpperCase() === "APPROVED" || status?.toUpperCase() === "SUCCESS") {
        await markOrderPaid(merchantTxnId, paymentId);
        return NextResponse.redirect(
          `${baseUrl}/checkout/order-received?orderNumber=${merchantTxnId}&clearCart=true`
        );
      }
      return NextResponse.redirect(`${baseUrl}/checkout?error=status_check_failed`);
    }

    // 4. Determine final status from verified response
    const transactionStatus: string =
      verifyData.status ||
      verifyData.data?.status ||
      verifyData.data?.paymentStatus ||
      "";
    const upperStatus = transactionStatus.toUpperCase();

    console.log("[callback] Final verified status:", upperStatus);

    if (upperStatus === "APPROVED" || upperStatus === "SUCCESS" || upperStatus === "PAID") {
      await markOrderPaid(merchantTxnId, paymentId);
      return NextResponse.redirect(
        `${baseUrl}/checkout/order-received?orderNumber=${merchantTxnId}&clearCart=true`
      );
    } else {
      console.warn("[callback] Payment not approved:", upperStatus);
      await db.order.update({
        where: { orderNumber: merchantTxnId },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
          paymentMethod: "PayGlocal",
          paymentId: paymentId || `PAY-FAILED-${Date.now()}`,
        },
      });
      return NextResponse.redirect(
        `${baseUrl}/checkout?error=payment_declined&orderNumber=${merchantTxnId}`
      );
    }
  } catch (error: any) {
    console.error("[callback] Error:", error);
    return NextResponse.redirect(`${baseUrl}/checkout?error=callback_processing_failed`);
  }
}

/**
 * Marks an order as PAID + CONFIRMED and runs stock/coupon processing.
 * Idempotent — skips if order is already PAID.
 */
async function markOrderPaid(merchantTxnId: string, paymentId: string | null) {
  const order = await db.order.findUnique({
    where: { orderNumber: merchantTxnId },
  });

  if (!order) {
    console.error("[markOrderPaid] Order not found:", merchantTxnId);
    return;
  }

  if (order.paymentStatus === "PAID") {
    console.log("[markOrderPaid] Order already PAID, skipping:", merchantTxnId);
    return;
  }

  await db.order.update({
    where: { orderNumber: merchantTxnId },
    data: {
      paymentStatus: "PAID",
      status: "CONFIRMED",
      paymentMethod: "PayGlocal",
      paymentId: paymentId || `PAY-${Date.now()}`,
    },
  });

  console.log("[markOrderPaid] Order marked PAID:", merchantTxnId);

  // Deduct stock and track coupon usage
  await processOrderStockAndCoupon(order.id);
}
