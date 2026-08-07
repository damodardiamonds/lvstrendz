import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/session";

// GET: List all attributes and their values
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const attributes = await db.attribute.findMany({
      include: {
        values: {
          orderBy: { value: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: attributes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add attribute value (Color or Size)
export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, value, colorCode } = body; // type: 'color' | 'size'

    if (!value || !type) {
      return NextResponse.json({ error: "Type and value are required" }, { status: 400 });
    }

    const valTrimmed = value.trim();
    const attrName = type.toLowerCase() === 'color' ? 'Color' : 'Size';
    const attrSlug = type.toLowerCase();

    let attr = await db.attribute.findUnique({ where: { slug: attrSlug } });
    if (!attr) {
      attr = await db.attribute.create({
        data: { name: attrName, slug: attrSlug },
      });
    }

    const slug = valTrimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    const existing = await db.attributeValue.findFirst({
      where: { attributeId: attr.id, slug },
    });

    let result;
    if (existing) {
      result = await db.attributeValue.update({
        where: { id: existing.id },
        data: { value: valTrimmed, colorCode: colorCode || existing.colorCode },
      });
    } else {
      result = await db.attributeValue.create({
        data: {
          attributeId: attr.id,
          value: valTrimmed,
          slug,
          colorCode: colorCode || null,
        },
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Delete attribute value
export async function DELETE(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Attribute value ID is required" }, { status: 400 });
    }

    await db.attributeValue.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
