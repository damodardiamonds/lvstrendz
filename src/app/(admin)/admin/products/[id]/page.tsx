
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import ProductForm from "../components/ProductForm";
import { updateProduct } from "../actions";

export const metadata = {
  title: "Edit Product | Admin - LV's Trendz",
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ updated?: string; page?: string }>;
}

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const { id } = await params;
  const { updated, page } = (await searchParams) || {};

  const backHref = page && page !== "1" ? `/admin/products?page=${page}` : "/admin/products";

  const [product, categories, attributes] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        categories: {
          select: { categoryId: true },
        },
      },
    }),
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

  if (!product) {
    notFound();
  }

  const colorAttr = attributes.find((a) => a.slug === "color");
  const sizeAttr = attributes.find((a) => a.slug === "size");

  const availableColors = colorAttr ? colorAttr.values.map((v) => ({ id: v.id, value: v.value, colorCode: v.colorCode })) : [];
  const availableSizes = sizeAttr ? sizeAttr.values.map((v) => ({ id: v.id, value: v.value })) : [];

  // Convert Decimal fields to numbers for the form
  const productData = {
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    costPrice: product.costPrice ? Number(product.costPrice) : null,
    weight: product.weight ? Number(product.weight) : null,
  };

  const selectedCategoryIds = product.categories.map((c) => c.categoryId);

  // Bind the product ID to the update action
  const updateWithId = updateProduct.bind(null, id);

  return (
    <div>
      {/* Success Notification */}
      {updated === "true" && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3">
          <CheckCircle size={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Product updated successfully!</p>
            <p className="text-xs text-emerald-600 mt-0.5">All changes have been saved and applied across the store.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={backHref}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-800">Attributes & Stock</p>
            <p className="text-xs text-blue-600 mt-0.5">
              Manage colors, sizes & stock
            </p>
          </div>
          <Link
            href={`/admin/products/${id}/variants${page ? `?page=${page}` : ""}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Manage
          </Link>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-800">Images</p>
            <p className="text-xs text-purple-600 mt-0.5">
              Upload & reorder product photos
            </p>
          </div>
          <Link
            href={`/admin/products/${id}/images${page ? `?page=${page}` : ""}`}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Manage
          </Link>
        </div>
      </div>

      {/* Product Form */}
      <ProductForm
        product={productData}
        selectedCategoryIds={selectedCategoryIds}
        categories={categories}
        availableColors={availableColors}
        availableSizes={availableSizes}
        action={updateWithId}
        submitLabel="Update Product"
        cancelHref={backHref}
      />
    </div>
  );
}

