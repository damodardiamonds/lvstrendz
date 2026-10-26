import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeFilter = searchParams.get("time") || "all"; // "today" | "week" | "month" | "all"

    let dateFilter: Date | undefined;
    if (timeFilter === "today") {
      dateFilter = new Date();
      dateFilter.setHours(0, 0, 0, 0);
    } else if (timeFilter === "week") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeFilter === "month") {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 30);
    }

    // 1. Fetch active cart items with product, variant, and user info
    const activeCartItems = await db.cartItem.findMany({
      where: {
        status: "ACTIVE",
        ...(dateFilter ? { updatedAt: { gte: dateFilter } } : {}),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            sku: true,
            stock: true,
            images: {
              take: 1,
              orderBy: { sortOrder: "asc" },
              select: { url: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 2. Fetch add-to-cart events
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayAddsCount, allTimeAddsCount, recentEvents] = await Promise.all([
      db.cartEvent.count({
        where: {
          eventType: "ADD",
          createdAt: { gte: todayStart },
        },
      }),
      db.cartEvent.count({
        where: { eventType: "ADD" },
      }),
      db.cartEvent.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
          product: {
            select: {
              images: {
                take: 1,
                orderBy: { sortOrder: "asc" },
                select: { url: true },
              },
            },
          },
        },
      }),
    ]);

    // 3. Aggregate product-level demand
    // Product map key -> { product, activeShoppers: Set, activeUnits: number, activeValue: number, sizeCounts, shoppers }
    const productMap = new Map<
      string,
      {
        productId: string;
        name: string;
        slug: string;
        sku: string | null;
        price: number;
        image: string | null;
        stock: number;
        activeShopperSessions: Set<string>;
        activeQuantity: number;
        activeValue: number;
        sizeBreakdown: Record<string, number>;
        shoppers: Array<{
          sessionId: string;
          name: string;
          email: string | null;
          phone: string | null;
          quantity: number;
          size: string | null;
          color: string | null;
          addedAt: string;
        }>;
      }
    >();

    const distinctShoppers = new Set<string>();
    let totalPotentialValue = 0;
    let totalActiveCartUnits = 0;

    activeCartItems.forEach((item) => {
      distinctShoppers.add(item.sessionId);
      const itemPrice = Number(item.price) || Number(item.product?.price) || 0;
      const itemTotal = itemPrice * item.quantity;
      totalPotentialValue += itemTotal;
      totalActiveCartUnits += item.quantity;

      const pId = item.productId;
      if (!productMap.has(pId)) {
        productMap.set(pId, {
          productId: pId,
          name: item.product?.name || "Unknown Product",
          slug: item.product?.slug || "",
          sku: item.sku || item.product?.sku || null,
          price: itemPrice,
          image: item.product?.images?.[0]?.url || null,
          stock: item.product?.stock || 0,
          activeShopperSessions: new Set<string>(),
          activeQuantity: 0,
          activeValue: 0,
          sizeBreakdown: {},
          shoppers: [],
        });
      }

      const entry = productMap.get(pId)!;
      entry.activeShopperSessions.add(item.sessionId);
      entry.activeQuantity += item.quantity;
      entry.activeValue += itemTotal;

      const sizeKey = item.size || "Standard";
      entry.sizeBreakdown[sizeKey] = (entry.sizeBreakdown[sizeKey] || 0) + item.quantity;

      const customerDisplayName =
        item.customerName ||
        item.user?.name ||
        `Guest (${item.sessionId.substring(0, 10)})`;

      entry.shoppers.push({
        sessionId: item.sessionId,
        name: customerDisplayName,
        email: item.customerEmail || item.user?.email || null,
        phone: item.customerPhone || item.user?.phone || null,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        addedAt: item.createdAt.toISOString(),
      });
    });

    // Also get all-time distinct people who added each product from cartEvent
    const allTimeEvents = await db.cartEvent.findMany({
      where: {
        eventType: "ADD",
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
      },
      select: {
        productId: true,
        sessionId: true,
        quantity: true,
        productName: true,
        productSlug: true,
        productImage: true,
        price: true,
        sku: true,
      },
    });

    const allTimeProductPeople = new Map<string, Set<string>>();
    const allTimeProductUnits = new Map<string, number>();

    allTimeEvents.forEach((ev) => {
      if (!allTimeProductPeople.has(ev.productId)) {
        allTimeProductPeople.set(ev.productId, new Set<string>());
        allTimeProductUnits.set(ev.productId, 0);
      }
      allTimeProductPeople.get(ev.productId)!.add(ev.sessionId);
      allTimeProductUnits.set(
        ev.productId,
        (allTimeProductUnits.get(ev.productId) || 0) + (ev.quantity || 1)
      );

      // If product wasn't in activeCartItems (e.g. removed or previously added), still make sure it appears in demand list if desired
      if (!productMap.has(ev.productId)) {
        productMap.set(ev.productId, {
          productId: ev.productId,
          name: ev.productName || "Product",
          slug: ev.productSlug || "",
          sku: ev.sku || null,
          price: Number(ev.price) || 0,
          image: ev.productImage || null,
          stock: 0,
          activeShopperSessions: new Set<string>(),
          activeQuantity: 0,
          activeValue: 0,
          sizeBreakdown: {},
          shoppers: [],
        });
      }
    });

    // Format products list
    const productDemand = Array.from(productMap.values()).map((p) => {
      const allTimeSet = allTimeProductPeople.get(p.productId);
      const allTimePeopleCount = allTimeSet
        ? allTimeSet.size
        : p.activeShopperSessions.size;

      return {
        productId: p.productId,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        image: p.image,
        stock: p.stock,
        peopleCount: p.activeShopperSessions.size, // How many people currently have it in cart
        allTimePeopleCount, // Total people who added this product
        activeUnits: p.activeQuantity,
        allTimeUnits: allTimeProductUnits.get(p.productId) || p.activeQuantity,
        activeValue: p.activeValue,
        sizeBreakdown: p.sizeBreakdown,
        shoppers: p.shoppers,
      };
    });

    // Sort by currently in cart people count descending, then by allTime
    productDemand.sort((a, b) => {
      if (b.peopleCount !== a.peopleCount) {
        return b.peopleCount - a.peopleCount;
      }
      return b.allTimePeopleCount - a.allTimePeopleCount;
    });

    // 4. Group active sessions
    const sessionsMap = new Map<
      string,
      {
        sessionId: string;
        customerName: string;
        customerEmail: string | null;
        customerPhone: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        lastActiveAt: string;
        items: Array<{
          id: string;
          productId: string;
          productName: string;
          image: string | null;
          price: number;
          quantity: number;
          size: string | null;
          color: string | null;
        }>;
        totalValue: number;
        totalUnits: number;
      }
    >();

    activeCartItems.forEach((item) => {
      if (!sessionsMap.has(item.sessionId)) {
        const displayName =
          item.customerName ||
          item.user?.name ||
          `Guest Shopper (${item.sessionId.substring(0, 8)})`;

        sessionsMap.set(item.sessionId, {
          sessionId: item.sessionId,
          customerName: displayName,
          customerEmail: item.customerEmail || item.user?.email || null,
          customerPhone: item.customerPhone || item.user?.phone || null,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
          lastActiveAt: item.updatedAt.toISOString(),
          items: [],
          totalValue: 0,
          totalUnits: 0,
        });
      }

      const s = sessionsMap.get(item.sessionId)!;
      const price = Number(item.price) || Number(item.product?.price) || 0;
      s.totalValue += price * item.quantity;
      s.totalUnits += item.quantity;
      s.items.push({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || "Product",
        image: item.product?.images?.[0]?.url || null,
        price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
      });
    });

    const activeSessions = Array.from(sessionsMap.values()).sort(
      (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );

    // Format recent events
    const formattedRecentEvents = recentEvents.map((ev) => ({
      id: ev.id,
      eventType: ev.eventType,
      productId: ev.productId,
      productName: ev.productName,
      productSlug: ev.productSlug,
      productImage: ev.productImage || ev.product?.images?.[0]?.url || null,
      price: Number(ev.price) || 0,
      quantity: ev.quantity,
      size: ev.size,
      color: ev.color,
      customerName:
        ev.customerName || `Guest (${ev.sessionId.substring(0, 8)})`,
      customerEmail: ev.customerEmail,
      sessionId: ev.sessionId,
      createdAt: ev.createdAt.toISOString(),
      userAgent: ev.userAgent,
    }));

    return NextResponse.json({
      summary: {
        totalActiveCartUnits,
        totalUniqueProductsInCarts: productMap.size,
        totalActiveShoppers: distinctShoppers.size,
        totalPotentialValue,
        todayAdditionsCount: todayAddsCount,
        allTimeAdditionsCount: allTimeAddsCount,
      },
      productDemand,
      activeSessions,
      recentEvents: formattedRecentEvents,
    });
  } catch (error) {
    console.error("Admin Cart API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart activity" },
      { status: 500 }
    );
  }
}
