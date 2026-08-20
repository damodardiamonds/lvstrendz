
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import ProductForm from "../components/ProductForm";
import { createProduct } from "../actions";
import { db } from "@/lib/db";

export const metadata = {
  title: "Add Product | Admin - LV's Trendz",
};

export const dynamic = "force-dynamic";

interface NewProductPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const { page } = (await searchParams) || {};
  const backHref = page && page !== "1" ? `/admin/products?page=${page}` : "/admin/products";

  let categories: { id: string; name: string }[] = [];
  let availableColors: { id: string; value: string; colorCode: string | null }[] = [];
  let availableSizes: { id: string; value: string }[] = [];
  let dbError: string | null = null;

  try {
    const [fetchedCategories, attributes] = await Promise.all([
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

    categories = fetchedCategories;

    const colorAttr = attributes.find((a) => a.slug === "color");
    const sizeAttr = attributes.find((a) => a.slug === "size");

    availableColors = colorAttr ? colorAttr.values.map((v) => ({ id: v.id, value: v.value, colorCode: v.colorCode })) : [];
    availableSizes = sizeAttr ? sizeAttr.values.map((v) => ({ id: v.id, value: v.value })) : [];
  } catch (err: any) {
    console.error("Failed to load Add Product page data:", err);
    dbError = err?.message || "Failed to load page data from database.";
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={backHref}
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

      {/* DB Error Banner */}
      {dbError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-red-800">Failed to load page data</p>
            <p className="text-xs text-red-600 mt-1">{dbError}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <ProductForm
        action={createProduct}
        categories={categories}
        availableColors={availableColors}
        availableSizes={availableSizes}
        submitLabel="Create Product"
        cancelHref={backHref}
        returnPage={page}
      />
    </div>
  );
}

