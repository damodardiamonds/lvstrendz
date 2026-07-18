import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";
import { processOrderStockAndCoupon } from "@/lib/orders";

// Process the callback request (PayGlocal may call this via POST or GET redirect)
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
      // For POST requests, they can be multipart form data or JSON
      const contentType = request.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        merchantTxnId = formData.get("merchantTxnId") as string;
        paymentId = formData.get("paymentId") as string;
        status = formData.get("status") as string;
      } else if (contentType.includes("application/json")) {
        const body = await request.json();
        merchantTxnId = body.merchantTxnId;
        paymentId = body.paymentId;
        status = body.status;
      }
    }

    console.log("PayGlocal Callback received:", { merchantTxnId, paymentId, status });

    if (!merchantTxnId) {
      console.error("Missing merchantTxnId in PayGlocal callback");
      return NextResponse.redirect(`${baseUrl}/checkout?error=invalid_callback`);
    }

    // 2. Validate PEM files exist for doing the secure status call
    const publicPemPath = path.resolve(process.cwd(), process.env.PAYGLOCAL_PUBLIC_PEM_PATH || "./keys/payglocal_public.pem");
    const privatePemPath = path.resolve(process.cwd(), process.env.PAYGLOCAL_PRIVATE_PEM_PATH || "./keys/payglocal_private.pem");

    if (!fs.existsSync(publicPemPath) || !fs.existsSync(privatePemPath)) {
      console.error("PayGlocal PEM files missing in callback. Marking payment as PENDING for manual reconciliation.");
      
      // Update order to PENDING payment status for manual review
      await db.order.update({
        where: { orderNumber: merchantTxnId },
        data: {
          paymentStatus: "UNPAID",
          paymentMethod: "PayGlocal",
          paymentId: paymentId || "MISSING_KEYS_MANUAL_VERIFY",
        },
      });

      return NextResponse.redirect(`${baseUrl}/checkout/order-received?orderNumber=${merchantTxnId}&pending_verification=true`);
    }

    const publicKey = fs.readFileSync(publicPemPath, "utf8");
    const privateKey = fs.readFileSync(privatePemPath, "utf8");

    // 3. Prepare payload to call PayGlocal's transaction status API
    const statusPayload = {
      merchantTxnId,
      paymentId,
    };

    const { generateJWEAndJWS } = require("payglocal-js-client");

    const secureTokens = await generateJWEAndJWS({
      payload: statusPayload,
      publicKey: publicKey,
      privateKey: privateKey,
      merchantId: process.env.PAYGLOCAL_MERCHANT_ID || "ptplkikanikr2907",
      publicKeyId: process.env.PAYGLOCAL_PUBLIC_KEY_ID || "8cc91c8d-8030-4660-a9c7-33de886fb495",
      privateKeyId: process.env.PAYGLOCAL_PRIVATE_KEY_ID || "orLiT1gipnQYVqey_ptplkikanikr2907",
    });

    const isProduction = process.env.PAYGLOCAL_ENVIRONMENT === "production";
    const pgApiUrl = isProduction 
      ? (process.env.PAYGLOCAL_PRODUCTION_URL || "https://api.payglocal.in")
      : (process.env.PAYGLOCAL_SANDBOX_URL || "https://sandbox.payglocal.in");

    // 4. Server-to-server check to verify payment status
    const verifyRes = await fetch(`${pgApiUrl}/gl/v1/payments/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gl-token-external": secureTokens.jwsToken,
      },
      body: JSON.stringify({
        jweToken: secureTokens.jweToken,
      }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      console.error("PayGlocal Status Check API failed:", verifyData);
      return NextResponse.redirect(`${baseUrl}/checkout?error=status_check_failed`);
    }

    // Determine status from the verified response payload (which may require decryption depending on settings)
    // Note: Standard API returns decrypt status, let's check for standard fields first
    const transactionStatus = verifyData.status || (verifyData.data && verifyData.data.status);

    console.log("Verified transaction status:", transactionStatus);

    const upperStatus = typeof transactionStatus === "string" ? transactionStatus.toUpperCase() : "";

    if (upperStatus === "APPROVED" || upperStatus === "SUCCESS") {
      // Fetch order to see if it's already marked as PAID to prevent double processing
      const order = await db.order.findUnique({
        where: { orderNumber: merchantTxnId }
      });

      if (order && order.paymentStatus !== "PAID") {
        // 5. Update Database Order
        await db.order.update({
          where: { orderNumber: merchantTxnId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            paymentMethod: "PayGlocal",
            paymentId: paymentId || `PAY-${Date.now()}`,
          },
        });

        // Decrement stock and update coupon counts
        await processOrderStockAndCoupon(order.id);
      }

      return NextResponse.redirect(`${baseUrl}/checkout/order-received?orderNumber=${merchantTxnId}`);
    } else {
      console.warn(`Transaction was not approved: ${transactionStatus}`);
      
      // Update Database Order to FAILED and status to CANCELLED
      await db.order.update({
        where: { orderNumber: merchantTxnId },
        data: {
          paymentStatus: "FAILED",
          status: "CANCELLED",
          paymentMethod: "PayGlocal",
          paymentId: paymentId || `PAY-FAILED-${Date.now()}`,
        },
      });

      return NextResponse.redirect(`${baseUrl}/checkout?error=payment_declined&orderNumber=${merchantTxnId}`);
    }

  } catch (error: any) {
    console.error("Error in PayGlocal Callback Route:", error);
    return NextResponse.redirect(`${baseUrl}/checkout?error=callback_processing_failed`);
  }
}
