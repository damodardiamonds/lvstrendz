import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // 4. Create Order & Items
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        addressId: address.id,
        status: "PENDING",
        paymentStatus: "PAID", // Assuming mock secure prepaid checkout was processed
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

    // 5. Stock Management
    for (const item of items) {
      if (item.variantId) {
        const variant = await db.variant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });
        if (variant && variant.product.manageStock) {
          await db.variant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: Number(item.quantity),
              },
            },
          });
          // Also update parent product stock aggregator
          await db.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: Number(item.quantity),
              },
            },
          });
        }
      } else {
        const product = await db.product.findUnique({
          where: { id: item.productId },
        });
        if (product && product.manageStock) {
          await db.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: Number(item.quantity),
              },
            },
          });
        }
      }
    }

    // 6. Coupon tracking increment
    if (couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: {
            equals: couponCode.trim(),
            mode: "insensitive",
          },
        },
      });
      if (coupon) {
        await db.coupon.update({
          where: { id: coupon.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }
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
