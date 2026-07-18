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

    // 2. Validate PEM files existence
    const publicPemPath = path.resolve(process.cwd(), process.env.PAYGLOCAL_PUBLIC_PEM_PATH || "./keys/payglocal_public.pem");
    const privatePemPath = path.resolve(process.cwd(), process.env.PAYGLOCAL_PRIVATE_PEM_PATH || "./keys/payglocal_private.pem");

    if (!fs.existsSync(publicPemPath) || !fs.existsSync(privatePemPath)) {
      console.warn("PayGlocal PEM files are missing. Please upload them to the keys/ directory.");
      return NextResponse.json(
        {
          error: "PayGlocal PEM files are missing.",
          setupRequired: true,
          message: "Please place payglocal_public.pem and payglocal_private.pem in your project's keys/ directory to connect to PayGlocal.",
        },
        { status: 503 }
      );
    }

    // 3. Read PEM contents
    const publicKey = fs.readFileSync(publicPemPath, "utf8");
    const privateKey = fs.readFileSync(privatePemPath, "utf8");

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
      privateKeyId: process.env.PAYGLOCAL_PRIVATE_KEY_ID || "orLiT1gipnQYVqey_ptplkikanikr2907",
    });

    const isProduction = process.env.PAYGLOCAL_ENVIRONMENT === "production";
    const baseUrl = isProduction 
      ? (process.env.PAYGLOCAL_PRODUCTION_URL || "https://api.payglocal.in")
      : (process.env.PAYGLOCAL_SANDBOX_URL || "https://sandbox.payglocal.in");

    // 6. Post Secure Payload to PayGlocal
    const pgResponse = await fetch(`${baseUrl}/gl/v1/payments/paycollect`, {
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
      return NextResponse.json(
        { error: pgData.message || "Failed to initiate payment with PayGlocal API" },
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
