import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await db.product.findMany({
      include: {
        variants: {
          select: { id: true, stock: true },
        },
        images: {
          where: { sortOrder: 0 },
          select: { url: true, alt: true },
          take: 1,
        },
        categories: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
