
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Edit, Eye, EyeOff, Zap, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toggleProductStatus } from "../actions";
import DeleteButton from "./DeleteButton";
import QuickEditModal from "./QuickEditModal";

interface CategoryOption {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: unknown;
  compareAtPrice: unknown;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  variants: { id: string; stock: number }[];
  images: { url: string; alt: string | null }[];
  categories: { category: { id: string; name: string } }[];
}

interface ProductTableProps {
  products: Product[];
  allCategories?: CategoryOption[];
  initialPage?: number;
}

const ITEMS_PER_PAGE = 15;

export default function ProductTable({
  products,
  allCategories = [],
  initialPage = 1,
}: ProductTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft">("all");
  const [stockFilter, setStockFilter] = useState<"all" | "instock" | "out" | "low">("all");

  const urlPage = parseInt(searchParams.get("page") || `${initialPage}`, 10) || 1;
  const [currentPage, setCurrentPage] = useState(urlPage);

  useEffect(() => {
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage);
    }
  }, [urlPage]);

  const changePage = (newPage: number) => {
    setCurrentPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    if (newPage > 1) {
      params.set("page", newPage.toString());
    } else {
      params.delete("page");
    }
    const query = params.toString();
    router.push(`/admin/products${query ? `?${query}` : ""}`, { scroll: false });
  };

  // Filter products based on search, category, status, and stock
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku) return false;
      }

      // Category Filter
      if (selectedCategory !== "all") {
        const inCategory = p.categories.some(
          (c) => c.category.id === selectedCategory
        );
        if (!inCategory) return false;
      }

      // Status Filter
      if (statusFilter === "active" && !p.isActive) return false;
      if (statusFilter === "draft" && p.isActive) return false;

      // Stock Filter
      const totalStock =
        p.stock + p.variants.reduce((sum, v) => sum + v.stock, 0);
      if (stockFilter === "instock" && totalStock <= 0) return false;
      if (stockFilter === "out" && totalStock > 0) return false;
      if (stockFilter === "low" && (totalStock <= 0 || totalStock > 5)) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, statusFilter, stockFilter]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    changePage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    changePage(1);
  };

  const handleStatusChange = (val: "all" | "active" | "draft") => {
    setStatusFilter(val);
    changePage(1);
  };

  const handleStockChange = (val: "all" | "instock" | "out" | "low") => {
    setStockFilter(val);
    changePage(1);
  };

  return (
    <>
      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E]"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          {allCategories.length > 0 && (
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E] bg-white cursor-pointer"
            >
              <option value="all">All Categories</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E] bg-white cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="draft">Draft Only</option>
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => handleStockChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-[#A0463E] focus:border-[#A0463E] bg-white cursor-pointer"
          >
            <option value="all">All Stock</option>
            <option value="instock">In Stock</option>
            <option value="low">Low Stock (≤5)</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Product
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  SKU
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Price
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Stock
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Variants
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Status
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => {
                  const totalVariantStock = product.variants.reduce(
                    (sum, v) => sum + v.stock,
                    0
                  );
                  const totalStock = product.stock + totalVariantStock;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Product Name + Image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-200/60">
                            {product.images[0] ? (
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-gray-400 text-[10px]">No img</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {product.name}
                            </p>
                            {product.categories.length > 0 && (
                              <p className="text-xs text-gray-500">
                                {product.categories
                                  .map((c) => c.category.name)
                                  .join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3 text-gray-600">
                        {product.sku || "—"}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-medium text-gray-900">
                            ₹{Number(product.price).toLocaleString("en-IN")}
                          </span>
                          {Number(product.compareAtPrice) > 0 && (
                            <span className="text-xs text-gray-400 line-through ml-1">
                              ₹{Number(product.compareAtPrice).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            totalStock === 0
                              ? "bg-red-100 text-red-700"
                              : totalStock <= 5
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {totalStock}
                        </span>
                      </td>

                      {/* Variants */}
                      <td className="px-4 py-3 text-gray-600">
                        {product.variants.length}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            toggleProductStatus(product.id, !product.isActive)
                          }
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                            product.isActive
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {product.isActive ? (
                            <>
                              <Eye size={12} /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} /> Draft
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingProduct(product)}
                            className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium text-xs flex items-center gap-1 transition-colors border border-amber-200"
                            title="Quick Edit"
                          >
                            <Zap size={13} className="fill-amber-600 text-amber-600" />
                            Quick Edit
                          </button>
                          <Link
                            href={`/admin/products/${product.id}${currentPage > 1 ? `?page=${currentPage}` : ""}`}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#A0463E] transition-colors"
                            title="Full Edit"
                          >
                            <Edit size={16} />
                          </Link>
                          <DeleteButton productId={product.id} productName={product.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                    No products matched your search or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
            <div>
              Showing <span className="font-semibold">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)}</span> to{" "}
              <span className="font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of{" "}
              <span className="font-semibold">{filteredProducts.length}</span> products
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => changePage(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => changePage(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editingProduct && (
        <QuickEditModal
          product={editingProduct}
          allCategories={allCategories}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </>
  );
}


