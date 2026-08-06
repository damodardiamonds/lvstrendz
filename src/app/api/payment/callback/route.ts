import { NextRequest, NextResponse } from "next/server";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * PayGlocal browser redirect handler (merchantCallbackURL).
 *
 * PayGlocal redirects the user's browser here after payment is attempted.
 * This route ONLY redirects the user — it does NOT update the database.
 * All DB updates (order status, stock, coupons) are handled by the webhook:
 *   POST /api/payment/webhook
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

    // PayGlocal sends these as query params on redirect
    let merchantTxnId = searchParams.get("merchantTxnId");
    let status = searchParams.get("status");
    let paymentId = searchParams.get("paymentId");

    // For POST redirects, also try body
    if (request.method === "POST" && (!merchantTxnId || !status)) {
      try {
        const contentType = request.headers.get("content-type") || "";
        if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          merchantTxnId = merchantTxnId || (formData.get("merchantTxnId") as string);
          status = status || (formData.get("status") as string);
          paymentId = paymentId || (formData.get("paymentId") as string);
        } else {
          const text = await request.text();
          try {
            const body = JSON.parse(text);
            merchantTxnId = merchantTxnId || body.merchantTxnId || body.data?.merchantTxnId;
            status = status || body.status || body.data?.status;
            paymentId = paymentId || body.paymentId || body.data?.paymentId;
          } catch { /* ignore */ }
        }
      } catch { /* ignore */ }
    }

    console.log("[callback] Browser redirect received:", { merchantTxnId, status, paymentId });

    if (!merchantTxnId) {
      console.error("[callback] Missing merchantTxnId in redirect");
      return NextResponse.redirect(`${baseUrl}/checkout?error=invalid_callback`);
    }

    const upperStatus = (status || "").toUpperCase();

    // Redirect to success page — webhook will confirm and update DB
    if (upperStatus === "APPROVED" || upperStatus === "SUCCESS" || upperStatus === "PAID" || upperStatus === "INPROGRESS") {
      return NextResponse.redirect(
        `${baseUrl}/checkout/order-received?orderNumber=${merchantTxnId}&clearCart=true`
      );
    }

    // Redirect to failure — payment was declined or cancelled
    return NextResponse.redirect(
      `${baseUrl}/checkout?error=payment_declined&orderNumber=${merchantTxnId}`
    );

  } catch (error: any) {
    console.error("[callback] Error during redirect:", error);
    return NextResponse.redirect(`${baseUrl}/checkout?error=callback_error`);
  }
}
