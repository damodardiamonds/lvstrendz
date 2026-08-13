import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processOrderStockAndCoupon } from "@/lib/orders";
import { sendAdminPushNotification } from "@/backend/lib/push-notifications";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      line1,
      line2,
      city,
      state,
      pincode,
      country = "India",
      items,
      couponCode,
      giftCardCode,
      giftCardDiscount = 0,
      subtotal,
      discount,
      shipping,
      total,
      paymentMethod = "Prepaid Gateway",
      paymentId,
      notes,
    } = body;

    // Validate inputs
    if (
      !email ||
      !firstName ||
      !lastName ||
      !phone ||
      !line1 ||
      !city ||
      !state ||
      !pincode ||
      !items ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required contact, shipping, or item details" },
        { status: 400 }
      );
    }

    // 1. User resolution (Find or create Customer account for Guest)
    let user = await db.user.findFirst({
      where: {
        OR: [
          { email: email.trim().toLowerCase() },
          { phone: phone.trim() }
        ]
      }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          role: "CUSTOMER",
        },
      });
    }

    // 2. Address Creation
    const address = await db.address.create({
      data: {
        userId: user.id,
        name: `${firstName.trim()} ${lastName.trim()}`,
        phone: phone.trim(),
        line1: line1.trim(),
        line2: line2 ? line2.trim() : null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country.trim(),
      },
    });

    // 3. Generate Order Number
    const orderNumber = `LVS-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Auto-apply active eligible coupon server-side if client didn't specify a coupon
    let finalCouponCode = couponCode || null;
    let finalDiscount = Number(discount || 0) + Number(giftCardDiscount || 0);
    let finalTotal = Number(total);

    if (!finalCouponCode && Number(discount || 0) === 0) {
      const now = new Date();
      const activeCoupon = await db.coupon.findFirst({
        where: {
          isActive: true,
          OR: [{ startsAt: null }, { startsAt: { lte: now } }],
          AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] }],
        },
        orderBy: { createdAt: "desc" },
      });

      if (activeCoupon) {
        const minVal = activeCoupon.minOrderValue ? Number(activeCoupon.minOrderValue) : 0;
        const subVal = Number(subtotal);

        if (subVal >= minVal && (activeCoupon.usageLimit === null || activeCoupon.usedCount < activeCoupon.usageLimit)) {
          finalCouponCode = activeCoupon.code;
          let calculatedDiscount = 0;
          if (activeCoupon.type === "PERCENTAGE") {
            calculatedDiscount = (subVal * Number(activeCoupon.value)) / 100;
          } else {
            calculatedDiscount = Number(activeCoupon.value);
          }
          if (activeCoupon.maxDiscount && calculatedDiscount > Number(activeCoupon.maxDiscount)) {
            calculatedDiscount = Number(activeCoupon.maxDiscount);
          }
          finalDiscount = calculatedDiscount + Number(giftCardDiscount || 0);
          finalTotal = Math.max(0, subVal - finalDiscount + Number(shipping || 0));
        }
      }
    }

    // Determine initial payment status: If total is 0 (fully covered by gift card), mark as PAID and CONFIRMED
    const isZeroTotal = finalTotal <= 0;
    const initialStatus = isZeroTotal ? "CONFIRMED" : "PENDING";
    const initialPaymentStatus = isZeroTotal ? "PAID" : "UNPAID";
    const finalPaymentMethod = isZeroTotal ? "Gift Card" : paymentMethod;

    // 4. Create Order & Items
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: address.id,
        status: initialStatus,
        paymentStatus: initialPaymentStatus,
        paymentMethod: finalPaymentMethod,
        paymentId: isZeroTotal ? `GC-${giftCardCode || Date.now()}` : (paymentId || `PAY-${Date.now()}`),
        subtotal: Number(subtotal),
        discount: finalDiscount,
        shipping: Number(shipping || 0),
        total: finalTotal,
        couponCode: finalCouponCode,
        notes: giftCardCode ? `${notes ? notes + " | " : ""}Gift Card Applied: ${giftCardCode}` : (notes || null),
        shippingAddress: {
          name: `${firstName.trim()} ${lastName.trim()}`,
          phone: phone.trim(),
          line1: line1.trim(),
          line2: line2 ? line2.trim() : null,
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          country: country.trim(),
        },
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId || null,
            name: item.name,
            sku: item.sku || null,
            price: Number(item.price),
            quantity: Number(item.quantity),
            attributes: item.attributes || null,
          })),
        },
      },
    });

    // Redeem gift card balance if code was applied
    if (giftCardCode && Number(giftCardDiscount) > 0) {
      try {
        const gc = await db.giftCard.findFirst({
          where: { code: { equals: giftCardCode.trim(), mode: "insensitive" } },
        });

        if (gc) {
          const currentBal = Number(gc.balance);
          const deduct = Math.min(currentBal, Number(giftCardDiscount));
          const newBal = currentBal - deduct;
          await db.giftCard.update({
            where: { id: gc.id },
            data: {
              balance: newBal,
              isRedeemed: newBal === 0,
              redeemedBy: user.id,
              redeemedAt: new Date(),
              orderId: order.id,
            },
          });
          console.log(`[orders] Redeemed ${deduct} from gift card ${gc.code} for order ${order.orderNumber}`);
        }
      } catch (gcErr) {
        console.error("[orders] Error redeeming gift card:", gcErr);
      }
    }

    // 5. Stock and Coupon Processing (only if paid immediately)
    if (order.paymentStatus === "PAID") {
      await processOrderStockAndCoupon(order.id);
    }

    // 6. Push notification to admin app
    sendAdminPushNotification({
      title: "📦 New Order Created",
      body: `Order #${order.orderNumber} (₹${finalTotal.toFixed(2)}) placed via ${paymentMethod}.`,
      data: { url: `/admin/orders/${order.id}`, screen: "orders" },
    }).catch((pushErr) => {
      console.error("[orders] Admin push notification error:", pushErr);
    });

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
    });
  } catch (error) {
    console.error("Order processing error:", error);
    return NextResponse.json(
      { error: "Failed to process order. Please try again." },
      { status: 500 }
    );
  }
}
