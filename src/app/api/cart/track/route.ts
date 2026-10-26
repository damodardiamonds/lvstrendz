import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { sendAdminPushNotification } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, item, items, customer } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const currentUser = await getCurrentUser();
    const userId = currentUser?.id || null;

    // Extract client IP and User Agent
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;
    const userAgent = req.headers.get("user-agent") || null;

    const customerName =
      customer?.name ||
      currentUser?.name ||
      null;
    const customerEmail =
      customer?.email ||
      currentUser?.email ||
      null;
    const customerPhone =
      customer?.phone ||
      currentUser?.phone ||
      null;

    if (action === "ADD" && item?.productId) {
      // Find product info if not completely provided
      let productName = item.name;
      let productSlug = item.slug;
      let productImage = item.image;
      let price = Number(item.price) || 0;
      let sku = item.sku || null;

      if (!productName || !productSlug || !price) {
        const prod = await db.product.findUnique({
          where: { id: item.productId },
          include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
        });
        if (prod) {
          productName = productName || prod.name;
          productSlug = productSlug || prod.slug;
          price = price || Number(prod.price) || 0;
          sku = sku || prod.sku;
          if (!productImage && prod.images.length > 0) {
            productImage = prod.images[0].url;
          }
        }
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);
      const size = item.size || null;
      const color = item.color || null;
      const variantId = item.variantId || null;

      // Check if this cart item is already active for this session
      const existing = await db.cartItem.findFirst({
        where: {
          sessionId,
          productId: item.productId,
          variantId,
          size,
          color,
          status: "ACTIVE",
        },
      });

      if (existing) {
        await db.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + quantity,
            price,
            sku: sku || existing.sku,
            userId: userId || existing.userId,
            customerName: customerName || existing.customerName,
            customerEmail: customerEmail || existing.customerEmail,
            customerPhone: customerPhone || existing.customerPhone,
            updatedAt: new Date(),
          },
        });
      } else {
        await db.cartItem.create({
          data: {
            sessionId,
            userId,
            productId: item.productId,
            variantId,
            sku,
            size,
            color,
            price,
            quantity,
            customMeasurements: item.customMeasurements || null,
            status: "ACTIVE",
            customerName,
            customerEmail,
            customerPhone,
            ipAddress,
            userAgent,
          },
        });
      }

      // Record immutable event log
      await db.cartEvent.create({
        data: {
          eventType: "ADD",
          sessionId,
          userId,
          productId: item.productId,
          variantId,
          productName: productName || "Unknown Product",
          productSlug: productSlug || "",
          productImage: productImage || null,
          sku,
          price,
          quantity,
          size,
          color,
          customMeasurements: item.customMeasurements || null,
          customerName,
          customerEmail,
          customerPhone,
          ipAddress,
          userAgent,
        },
      });

      // Dispatch non-blocking push notification to admin app
      sendAdminPushNotification({
        title: "🛒 Product Added to Cart!",
        body: `${customerName || "A shopper"} added "${productName || "Product"}" (${size ? `Size ${size}, ` : ""}Qty: ${quantity}) to their cart.`,
        data: {
          type: "cart_add",
          productId: item.productId,
          sessionId,
          productName,
        },
      }).catch((err) => {
        console.error("Cart push notification error:", err);
      });

      return NextResponse.json({ success: true, message: "Cart addition recorded" });
    }

    if (action === "UPDATE_QTY" && item?.productId) {
      const quantity = Number(item.quantity) || 0;
      const variantId = item.variantId || null;
      const size = item.size || null;
      const color = item.color || null;

      if (quantity <= 0) {
        // Mark removed
        await db.cartItem.updateMany({
          where: {
            sessionId,
            productId: item.productId,
            variantId,
            size,
            color,
            status: "ACTIVE",
          },
          data: {
            status: "REMOVED",
            updatedAt: new Date(),
          },
        });

        await db.cartEvent.create({
          data: {
            eventType: "REMOVE",
            sessionId,
            userId,
            productId: item.productId,
            variantId,
            productName: item.name || "Product",
            price: 0,
            quantity: 0,
            size,
            color,
            customerName,
            customerEmail,
            ipAddress,
            userAgent,
          },
        });
      } else {
        await db.cartItem.updateMany({
          where: {
            sessionId,
            productId: item.productId,
            variantId,
            size,
            color,
            status: "ACTIVE",
          },
          data: {
            quantity,
            updatedAt: new Date(),
          },
        });

        await db.cartEvent.create({
          data: {
            eventType: "UPDATE_QTY",
            sessionId,
            userId,
            productId: item.productId,
            variantId,
            productName: item.name || "Product",
            price: Number(item.price) || 0,
            quantity,
            size,
            color,
            customerName,
            customerEmail,
            ipAddress,
            userAgent,
          },
        });
      }

      return NextResponse.json({ success: true, message: "Cart quantity updated" });
    }

    if (action === "REMOVE" && item?.productId) {
      const variantId = item.variantId || null;
      const size = item.size || null;
      const color = item.color || null;

      await db.cartItem.updateMany({
        where: {
          sessionId,
          productId: item.productId,
          variantId,
          size,
          color,
          status: "ACTIVE",
        },
        data: {
          status: "REMOVED",
          updatedAt: new Date(),
        },
      });

      await db.cartEvent.create({
        data: {
          eventType: "REMOVE",
          sessionId,
          userId,
          productId: item.productId,
          variantId,
          productName: item.name || "Product",
          price: 0,
          quantity: 0,
          size,
          color,
          customerName,
          customerEmail,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json({ success: true, message: "Item removed from cart" });
    }

    if (action === "ORDERED") {
      // Mark all active cart items for this session as ORDERED
      await db.cartItem.updateMany({
        where: {
          sessionId,
          status: "ACTIVE",
        },
        data: {
          status: "ORDERED",
          customerName: customerName || undefined,
          customerEmail: customerEmail || undefined,
          customerPhone: customerPhone || undefined,
          updatedAt: new Date(),
        },
      });

      await db.cartEvent.create({
        data: {
          eventType: "ORDERED",
          sessionId,
          userId,
          productId: "ALL",
          productName: "Cart Checkout Completed",
          price: 0,
          quantity: 0,
          customerName,
          customerEmail,
          customerPhone,
          ipAddress,
          userAgent,
        },
      });

      return NextResponse.json({ success: true, message: "Cart marked as ordered" });
    }

    if (action === "SYNC" && Array.isArray(items)) {
      // Synchronize full cart snapshot
      // 1. Mark existing active items not in `items` as REMOVED
      const activeItems = await db.cartItem.findMany({
        where: { sessionId, status: "ACTIVE" },
      });

      for (const act of activeItems) {
        const stillInCart = items.some(
          (i) =>
            i.productId === act.productId &&
            (i.variantId || null) === (act.variantId || null) &&
            (i.size || null) === (act.size || null) &&
            (i.color || null) === (act.color || null)
        );

        if (!stillInCart) {
          await db.cartItem.update({
            where: { id: act.id },
            data: { status: "REMOVED", updatedAt: new Date() },
          });
        }
      }

      // 2. Upsert items
      for (const it of items) {
        if (!it.productId) continue;
        const variantId = it.variantId || null;
        const size = it.size || null;
        const color = it.color || null;
        const quantity = Math.max(1, Number(it.quantity) || 1);
        const price = Number(it.price) || 0;

        const match = activeItems.find(
          (act) =>
            act.productId === it.productId &&
            (act.variantId || null) === variantId &&
            (act.size || null) === size &&
            (act.color || null) === color
        );

        if (match) {
          if (match.quantity !== quantity || Number(match.price) !== price) {
            await db.cartItem.update({
              where: { id: match.id },
              data: {
                quantity,
                price,
                updatedAt: new Date(),
              },
            });
          }
        } else {
          await db.cartItem.create({
            data: {
              sessionId,
              userId,
              productId: it.productId,
              variantId,
              sku: it.sku || null,
              size,
              color,
              price,
              quantity,
              customMeasurements: it.customMeasurements || null,
              status: "ACTIVE",
              customerName,
              customerEmail,
              customerPhone,
              ipAddress,
              userAgent,
            },
          });
        }
      }

      return NextResponse.json({ success: true, message: "Cart synchronized" });
    }

    return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
  } catch (error) {
    console.error("Cart tracking error:", error);
    return NextResponse.json(
      { error: "Failed to process cart event" },
      { status: 500 }
    );
  }
}
