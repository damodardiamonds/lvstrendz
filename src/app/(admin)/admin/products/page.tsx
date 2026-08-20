
import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, Package } from "lucide-react";
import ProductTable from "./components/ProductTable";

export const metadata = {
  title: "Products | Admin - LV's Trendz",
};

async function getProducts() {
  const products = await db.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      isActive: true,
      isFeatured: true,
      createdAt: true,
      variants: {
        select: { id: true, stock: true },
      },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true, alt: true },
        take: 1,
      },
      categories: {
        select: {
          category: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((product) => ({
    ...product,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
  }));
}

interface ProductsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const { page: rawPage } = (await searchParams) || {};
  const initialPage = Math.max(1, parseInt(rawPage || "1", 10) || 1);

  const [products, allCategories] = await Promise.all([
    getProducts(),
    db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const addProductHref = initialPage > 1 ? `/admin/products/new?page=${initialPage}` : "/admin/products/new";

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
          href={addProductHref}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#A0463E] text-white text-sm font-medium rounded-lg hover:bg-[#8a3b34] transition-colors"
        >
          <Plus size={18} />
          Add Product
        </Link>
      </div>

      {/* Products Table */}
      {products.length > 0 ? (
        <ProductTable products={products} allCategories={allCategories} initialPage={initialPage} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No products yet</h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Get started by adding your first product.
          </p>
          <Link
            href={addProductHref}
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

