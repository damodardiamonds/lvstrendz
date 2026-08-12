import { db } from "@/lib/db";
import InventoryManager from "./components/InventoryManager";

export const metadata = {
  title: "Inventory Management | Admin - LV's Trendz",
};

export default async function AdminInventoryPage() {
  const [products, categories, attributes] = await Promise.all([
    db.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
        images: {
          select: { url: true, alt: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        variants: {
          include: {
            attributes: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.attribute.findMany({
      include: {
        values: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  const colorAttr = attributes.find((a) => a.slug === "color");
  const sizeAttr = attributes.find((a) => a.slug === "size");

  const availableColors = colorAttr
    ? colorAttr.values.map((v) => ({
        id: v.id,
        value: v.value,
        colorCode: v.colorCode,
      }))
    : [];

  const availableSizes = sizeAttr
    ? sizeAttr.values.map((v) => ({
        id: v.id,
        value: v.value,
      }))
    : [];

  // Convert Decimal fields to numbers for client components
  const formattedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          View and update product stock levels based on color and size options.
        </p>
      </div>

      {/* Inventory Manager Component */}
      <InventoryManager
        products={formattedProducts}
        categories={categories}
        allColors={availableColors}
        allSizes={availableSizes}
      />
    </div>
  );
}
