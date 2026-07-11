
"use client";

import Link from "next/link";
import { Edit, Eye, EyeOff } from "lucide-react";
import { toggleProductStatus } from "../actions";
import DeleteButton from "./DeleteButton";

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
  categories: { category: { name: string } }[];
}

export default function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
            {products.map((product) => {
              const totalVariantStock = product.variants.reduce(
                (sum, v) => sum + v.stock,
                0
              );
              const totalStock = product.stock + totalVariantStock;

              return (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  {/* Product Name + Image */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.images[0] ? (
                          <img
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">No img</span>
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
    ₹{Number(product.compareAtPrice).toLocaleString()}
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
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#A0463E] transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </Link>
                      <DeleteButton productId={product.id} productName={product.name} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

