import { Resend } from "resend";
import { db } from "@/lib/db";

/**
 * Format currency helper
 */
function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Sends an automated order confirmation email to the customer using Resend.
 * Safely handles missing API keys or errors without failing payment flow.
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      "[email] ⚠️ RESEND_API_KEY is not configured in .env. Skipping confirmation email dispatch."
    );
    return { success: false, reason: "missing_api_key" };
  }

  const resend = new Resend(apiKey);

  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      console.error(`[email] Order not found for ID: ${orderId}`);
      return { success: false, reason: "order_not_found" };
    }

    const customerEmail = order.user?.email;
    if (!customerEmail) {
      console.error(`[email] No customer email attached to order: ${order.orderNumber}`);
      return { success: false, reason: "missing_customer_email" };
    }

    const address = order.shippingAddress as any;
    const fromSender =
      process.env.RESEND_FROM_EMAIL || "LVS Trendz <orders@lvstrendz.com>";

    // Build Itemized HTML Table
    const itemsHtml = order.items
      .map((item) => {
        const attrs = item.attributes as any;
        let variantInfo = "";
        if (attrs && (attrs.size || attrs.color)) {
          variantInfo = `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${
            attrs.size ? `Size: ${attrs.size}` : ""
          }${attrs.size && attrs.color ? " | " : ""}${
            attrs.color ? `Color: ${attrs.color}` : ""
          }</div>`;
        }

        return `
          <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px 0; color: #111827; font-weight: 600; font-size: 13px;">
              ${item.name} ${variantInfo}
            </td>
            <td style="padding: 12px 0; text-align: center; color: #4b5563; font-size: 13px;">
              x${item.quantity}
            </td>
            <td style="padding: 12px 0; text-align: right; color: #111827; font-weight: 700; font-size: 13px;">
              ${formatINR(Number(item.price) * item.quantity)}
            </td>
          </tr>
        `;
      })
      .join("");

    const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Order Confirmation - ${order.orderNumber}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px 10px; color: #374151;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div style="background-color: #111827; padding: 28px 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 2px; margin: 0; text-transform: uppercase;">
                LVS TRENDZ
              </h1>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 6px; margin-bottom: 0; text-transform: uppercase; tracking: 1px;">
                Thank you for your order!
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
              
              <!-- Greeting & Status -->
              <div style="text-align: center; margin-bottom: 28px;">
                <h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 0 0 8px 0;">
                  Order Confirmed!
                </h2>
                <p style="font-size: 13px; color: #6b7280; margin: 0;">
                  We have received your payment and your order <strong style="color: #111827;">#${order.orderNumber}</strong> is currently being processed.
                </p>
              </div>

              <!-- Order Overview Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <tr>
                    <td style="color: #64748b; padding-bottom: 6px;">Order Number:</td>
                    <td style="text-align: right; font-weight: 700; color: #0f172a; padding-bottom: 6px;">${order.orderNumber}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding-bottom: 6px;">Date:</td>
                    <td style="text-align: right; font-weight: 700; color: #0f172a; padding-bottom: 6px;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b; padding-bottom: 6px;">Payment Method:</td>
                    <td style="text-align: right; font-weight: 700; color: #0f172a; padding-bottom: 6px;">${order.paymentMethod || "Online Payment"}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Payment Status:</td>
                    <td style="text-align: right; font-weight: 700; color: #16a34a;">PAID</td>
                  </tr>
                </table>
              </div>

              <!-- Items Table -->
              <h3 style="font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-bottom: 2px solid #111827; padding-bottom: 6px;">
                Order Details
              </h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <thead>
                  <tr style="border-bottom: 1px solid #e5e7eb; font-size: 11px; text-transform: uppercase; color: #6b7280;">
                    <th style="text-align: left; padding-bottom: 8px;">Item</th>
                    <th style="text-align: center; padding-bottom: 8px;">Qty</th>
                    <th style="text-align: right; padding-bottom: 8px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Financial Summary -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-bottom: 28px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="color: #6b7280; padding-bottom: 6px;">Subtotal</td>
                    <td style="text-align: right; color: #111827; font-weight: 600; padding-bottom: 6px;">${formatINR(Number(order.subtotal))}</td>
                  </tr>
                  ${
                    Number(order.discount) > 0
                      ? `
                    <tr>
                      <td style="color: #16a34a; padding-bottom: 6px;">Discount ${order.couponCode ? `(${order.couponCode})` : ""}</td>
                      <td style="text-align: right; color: #16a34a; font-weight: 600; padding-bottom: 6px;">-${formatINR(Number(order.discount))}</td>
                    </tr>
                    `
                      : ""
                  }
                  <tr>
                    <td style="color: #6b7280; padding-bottom: 8px;">Shipping</td>
                    <td style="text-align: right; color: #111827; font-weight: 600; padding-bottom: 8px;">
                      ${Number(order.shipping) === 0 ? "Free Shipping" : formatINR(Number(order.shipping))}
                    </td>
                  </tr>
                  <tr style="border-top: 2px solid #111827;">
                    <td style="color: #111827; font-weight: 800; font-size: 15px; padding-top: 10px;">Total Paid</td>
                    <td style="text-align: right; color: #A0463E; font-weight: 800; font-size: 16px; padding-top: 10px;">${formatINR(Number(order.total))}</td>
                  </tr>
                </table>
              </div>

              <!-- Delivery Address -->
              ${
                address
                  ? `
              <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #f3f4f6;">
                <h4 style="font-size: 12px; font-weight: 700; color: #111827; text-transform: uppercase; margin: 0 0 8px 0; tracking: 0.5px;">
                  Shipping Address
                </h4>
                <p style="font-size: 13px; color: #4b5563; margin: 0; line-height: 1.5;">
                  <strong style="color: #111827;">${address.name || ""}</strong><br />
                  ${address.line1 || ""}${address.line2 ? `, ${address.line2}` : ""}<br />
                  ${address.city || ""}, ${address.state || ""} - ${address.pincode || ""}<br />
                  ${address.country || "India"}<br />
                  Phone: ${address.phone || order.user.phone || "N/A"}
                </p>
              </div>
              `
                  : ""
              }

            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
              <p style="margin: 0 0 6px 0;">If you have any questions, feel free to contact us at support@lvstrendz.com.</p>
              <p style="margin: 0; font-weight: 600; color: #6b7280;">© ${new Date().getFullYear()} LVS Trendz. All rights reserved.</p>
            </div>

          </div>
        </body>
      </html>
    `;

    console.log(
      `[email] Sending confirmation email for order ${order.orderNumber} to ${customerEmail}...`
    );

    const { data, error } = await resend.emails.send({
      from: fromSender,
      to: [customerEmail],
      subject: `Order Confirmation - #${order.orderNumber}`,
      html: htmlContent,
    });

    if (error) {
      console.error("[email] ❌ Failed to send email via Resend:", error);
      return { success: false, error };
    }

    console.log(`[email] ✅ Confirmation email sent successfully! Email ID: ${data?.id}`);
    return { success: true, emailId: data?.id };
  } catch (err: any) {
    console.error("[email] ❌ Unexpected error in sendOrderConfirmationEmail:", err);
    return { success: false, error: err?.message || err };
  }
}
