import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId parameter" }, { status: 400 });
    }

    // 1. Fetch Order Details from DB
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        address: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Load PEM keys from Environment Variables or file system
    let publicKey = process.env.PAYGLOCAL_PUBLIC_KEY?.replace(/\\n/g, "\n");
    let privateKey = process.env.PAYGLOCAL_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!publicKey || !privateKey) {
      const publicPemPath = path.resolve(process.cwd(), process.env.PAYGLOCAL_PUBLIC_PEM_PATH || "./keys/payglocal_public.pem");
      const privatePemPath = path.resolve(process.cwd(), process.env.PAYGLOCAL_PRIVATE_PEM_PATH || "./keys/payglocal_private.pem");

      if (fs.existsSync(publicPemPath) && fs.existsSync(privatePemPath)) {
        publicKey = fs.readFileSync(publicPemPath, "utf8");
        privateKey = fs.readFileSync(privatePemPath, "utf8");
      }
    }

    if (!publicKey || !privateKey) {
      console.warn("PayGlocal PEM keys are missing.");
      return NextResponse.json(
        {
          error: "PayGlocal PEM keys are missing on the server.",
          setupRequired: true,
          message: "Please configure PAYGLOCAL_PUBLIC_KEY and PAYGLOCAL_PRIVATE_KEY in your hosting environment variables (e.g. Vercel) or place PEM files in keys/.",
        },
        { status: 503 }
      );
    }

    // 4. Construct PayGlocal PayCollect Payload
    const totalAmountStr = Number(order.total).toFixed(2);

    // Fallback names in case order address doesn't have it parsed
    const fullName = order.address.name || "Customer";
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Trendz";

    const payload = {
      merchantTxnId: order.orderNumber,
      paymentData: {
        totalAmount: totalAmountStr,
        txnCurrency: "INR",
      },
      clientData: {
        emailId: order.user.email || "guest@lvstrendz.com",
        phoneNumber: order.address.phone || order.user.phone || "9999999999",
        firstName: firstName,
        lastName: lastName,
      },
      merchantCallbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/payment/callback`,
    };

    // 5. Generate secure JWE (encryption) and JWS (digital signature) tokens
    // We import dynamically to avoid Next.js compile-time issues with Node native components inside CJS module imports
    const { generateJWEAndJWS } = require("payglocal-js-client");

    const secureTokens = await generateJWEAndJWS({
      payload,
      publicKey: publicKey,
      privateKey: privateKey,
      merchantId: process.env.PAYGLOCAL_MERCHANT_ID || "ptplkikanikr2907",
      publicKeyId: process.env.PAYGLOCAL_PUBLIC_KEY_ID || "8cc91c8d-8030-4660-a9c7-33de886fb495",
      privateKeyId: process.env.PAYGLOCAL_PRIVATE_KEY_ID || "kId-orLiT1gipnQYVqey",
    });

    const isProduction = process.env.PAYGLOCAL_ENVIRONMENT === "production";
    const baseUrl = isProduction
      ? (process.env.PAYGLOCAL_PRODUCTION_URL || "https://api.prod.payglocal.in")
      : (process.env.PAYGLOCAL_SANDBOX_URL || "https://api.uat.payglocal.in");

    // 6. Post Secure Payload to PayGlocal
    const pgResponse = await fetch(`${baseUrl}/gl/v1/payments/initiate/paycollect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gl-token-external": secureTokens.jwsToken,
      },
      body: JSON.stringify({
        jweToken: secureTokens.jweToken,
      }),
    });

    const pgData = await pgResponse.json();

    if (!pgResponse.ok) {
      console.error("PayGlocal API response error:", pgData);
      let errorMsg =
        pgData.errors?.displayMessage ||
        pgData.errors?.detailedMessage ||
        pgData.message ||
        "Failed to initiate payment with PayGlocal API";

      if (pgResponse.status === 401) {
        errorMsg = `PayGlocal Gateway Error (401 Authentication Failed): ${pgData.message || "Invalid credentials"}. Please check your PayGlocal Merchant ID, Key IDs, and PEM files.`;
      }

      return NextResponse.json(
        { error: errorMsg, rawResponse: pgData },
        { status: pgResponse.status }
      );
    }

    // Standard PayGlocal response includes a redirectUrl or a url to capture payment
    // If they return an encrypted JWE response, the helper client can decrypt it.
    // However, in typical PayCollect redirect flow, a plain redirectUrl is returned.
    const redirectUrl = pgData.redirectUrl || pgData.paymentUrl || (pgData.data && pgData.data.redirectUrl);

    if (redirectUrl) {
      return NextResponse.json({ redirectUrl });
    }

    return NextResponse.json(
      { error: "No redirect URL returned by PayGlocal", rawResponse: pgData },
      { status: 502 }
    );

  } catch (error: any) {
    console.error("Error in /api/payment/initiate:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error during payment initiation" },
      { status: 500 }
    );
  }
}
