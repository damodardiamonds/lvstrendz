import { db } from "@/lib/db";

/**
 * Deducts stock from products/variants and increments coupon usage when an order's payment is successful.
 * This is called to finalize the order resources.
 */
export async function processOrderStockAndCoupon(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      console.error(`[processOrderStockAndCoupon] Order not found: ${orderId}`);
      return;
    }

    console.log(`[processOrderStockAndCoupon] Processing stock and coupons for order: ${order.orderNumber}`);

    // 1. Stock Management
    for (const item of order.items) {
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
          console.log(`[processOrderStockAndCoupon] Decremented variant ${item.variantId} (and parent product) stock by ${item.quantity}`);
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
          console.log(`[processOrderStockAndCoupon] Decremented product ${item.productId} stock by ${item.quantity}`);
        }
      }
    }

    // 2. Coupon tracking increment
    if (order.couponCode) {
      const coupon = await db.coupon.findFirst({
        where: {
          code: {
            equals: order.couponCode.trim(),
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
        console.log(`[processOrderStockAndCoupon] Incremented usage count for coupon: ${order.couponCode}`);
      }
    }
  } catch (error) {
    console.error(`[processOrderStockAndCoupon] Error processing stock/coupon for order ${orderId}:`, error);
    throw error;
  }
}
