
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductForm from "../components/ProductForm";
import { createProduct } from "../actions";
import { db } from "@/lib/db";

export const metadata = {
  title: "Add Product | Admin - LV's Trendz",
};

export default async function NewProductPage() {
  const [categories, attributes] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.attribute.findMany({
      include: {
        values: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  const colorAttr = attributes.find((a) => a.slug === "color");
  const sizeAttr = attributes.find((a) => a.slug === "size");

  const availableColors = colorAttr ? colorAttr.values.map((v) => ({ id: v.id, value: v.value, colorCode: v.colorCode })) : [];
  const availableSizes = sizeAttr ? sizeAttr.values.map((v) => ({ id: v.id, value: v.value })) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create a new product for your store
          </p>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        action={createProduct}
        categories={categories}
        availableColors={availableColors}
        availableSizes={availableSizes}
        submitLabel="Create Product"
      />
    </div>
  );
}

