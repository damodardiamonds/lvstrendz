
import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import ProductTable from "./components/ProductTable";

export const metadata = {
  title: "Products | Admin - LV's Trendz",
};

async function getProducts() {
  return db.product.findMany({
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
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            {products.length} products in your store
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Products Table */}
      {products.length > 0 ? (
        <ProductTable products={products} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No products yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Get started by adding your first product.
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34]"
          >
            <Plus size={16} />
            Add Product
          </Link>
        </div>
      )}
    </div>
  );
}

