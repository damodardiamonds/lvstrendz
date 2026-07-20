import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { processOrderStockAndCoupon } from "@/lib/orders";

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

    // 4. Create Order & Items (Initial status is UNPAID until payment completes)
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: address.id,
        status: "PENDING",
        paymentStatus: "UNPAID",
        paymentMethod,
        paymentId: paymentId || `PAY-${Date.now()}`,
        subtotal: Number(subtotal),
        discount: Number(discount || 0),
        shipping: Number(shipping || 0),
        total: Number(total),
        couponCode: couponCode || null,
        notes: notes || null,
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

    // 5. Stock and Coupon Processing (only if paid immediately)
    if (order.paymentStatus === "PAID") {
      await processOrderStockAndCoupon(order.id);
    }

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
