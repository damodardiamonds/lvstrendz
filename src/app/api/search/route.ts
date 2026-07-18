import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      // Get products in 'the-elite-collection' category for popular products first
      let popularProducts = await db.product.findMany({
        where: {
          isActive: true,
          categories: {
            some: {
              category: { slug: 'the-elite-collection' },
            },
          },
        },
        take: 5,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      });

      // If less than 5, fill with general active products
      if (popularProducts.length < 5) {
        const fillLimit = 5 - popularProducts.length;
        const extraProducts = await db.product.findMany({
          where: {
            isActive: true,
            id: { notIn: popularProducts.map(p => p.id) },
          },
          take: fillLimit,
          orderBy: { createdAt: 'desc' },
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          },
        });
        popularProducts = [...popularProducts, ...extraProducts];
      }

      const formattedPopular = popularProducts.map(p => {
        const price = Number(p.price);
        const originalPrice = p.compareAtPrice ? Number(p.compareAtPrice) : null;
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price,
          originalPrice,
          image: p.images[0]?.url ?? "/images/placeholder.jpg",
        };
      });

      return NextResponse.json({ products: [], popular: formattedPopular });
    }

    // Search query provided
    const products = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { shortDescription: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 10,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
      },
    });

    const formattedProducts = products.map(p => {
      const price = Number(p.price);
      const originalPrice = p.compareAtPrice ? Number(p.compareAtPrice) : null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price,
        originalPrice,
        image: p.images[0]?.url ?? "/images/placeholder.jpg",
      };
    });

    return NextResponse.json({ products: formattedProducts, popular: [] });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}
