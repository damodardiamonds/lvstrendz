"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Check,
  AlertTriangle,
  Boxes,
  Package,
  Layers,
  Save,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { updateProductStockMatrix, updateSimpleProductStock } from "../actions";

export interface ColorAttr {
  id: string;
  value: string;
  colorCode: string | null;
}

export interface SizeAttr {
  id: string;
  value: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
}

export interface VariantData {
  id: string;
  stock: number;
  sku: string | null;
  attributes: {
    attributeValue: {
      id: string;
      value: string;
      slug: string;
      colorCode: string | null;
      attribute: {
        slug: string;
        name: string;
      };
    };
  }[];
}

export interface ProductInventoryData {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: number;
  stock: number;
  lowStockAlert: number;
  isActive: boolean;
  images: { url: string; alt: string | null }[];
  categories: { category: { id: string; name: string } }[];
  selectedColorIds: string[];
  selectedSizeIds: string[];
  variants: VariantData[];
}

interface InventoryManagerProps {
  products: ProductInventoryData[];
  categories: CategoryInfo[];
  allColors: ColorAttr[];
  allSizes: SizeAttr[];
}

export default function InventoryManager({
  products,
  categories,
  allColors,
  allSizes,
}: InventoryManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // Summary Metrics
  const totalProducts = products.length;
  const totalStockSum = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.lowStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCat === "ALL" ||
        p.categories.some((c) => c.category.id === selectedCat);

      let matchesStock = true;
      if (stockFilter === "IN_STOCK") matchesStock = p.stock > p.lowStockAlert;
      if (stockFilter === "LOW_STOCK") matchesStock = p.stock > 0 && p.stock <= p.lowStockAlert;
      if (stockFilter === "OUT_OF_STOCK") matchesStock = p.stock === 0;

      return matchesSearch && matchesCat && matchesStock;
    });
  }, [products, searchQuery, selectedCat, stockFilter]);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Products</p>
            <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Boxes size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Total Store Stock</p>
            <p className="text-2xl font-bold text-gray-900">{totalStockSum} units</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Low Stock Alert</p>
            <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium bg-white text-gray-700 focus:ring-2 focus:ring-[#A0463E] outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Level Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium bg-white text-gray-700 focus:ring-2 focus:ring-[#A0463E] outline-none"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt; 5)</option>
            <option value="LOW_STOCK">Low Stock (1 - 5)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>
        </div>
      </div>

      {/* Product Inventory Cards */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-semibold text-gray-800">No products found</h3>
            <p className="text-xs text-gray-500 mt-1">
              Try adjusting your search query or filter selections.
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductInventoryCard
              key={product.id}
              product={product}
              allColors={allColors}
              allSizes={allSizes}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProductInventoryCard({
  product,
  allColors,
  allSizes,
}: {
  product: ProductInventoryData;
  allColors: ColorAttr[];
  allSizes: SizeAttr[];
}) {
  const [expanded, setExpanded] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentTotalStock, setCurrentTotalStock] = useState(product.stock);

  // Determine Product Colors
  const productColors = useMemo(() => {
    if (product.selectedColorIds && product.selectedColorIds.length > 0) {
      return allColors.filter((c) => product.selectedColorIds.includes(c.id));
    }
    // Extract colors from existing variants
    const seen = new Set<string>();
    const res: ColorAttr[] = [];
    product.variants.forEach((v) => {
      v.attributes.forEach((attr) => {
        if (
          attr.attributeValue.attribute.slug === "color" &&
          !seen.has(attr.attributeValue.id)
        ) {
          seen.add(attr.attributeValue.id);
          res.push({
            id: attr.attributeValue.id,
            value: attr.attributeValue.value,
            colorCode: attr.attributeValue.colorCode,
          });
        }
      });
    });
    return res;
  }, [product, allColors]);

  // Determine Product Sizes
  const productSizes = useMemo(() => {
    let sizes: SizeAttr[] = [];
    if (product.selectedSizeIds && product.selectedSizeIds.length > 0) {
      sizes = allSizes.filter((s) => product.selectedSizeIds.includes(s.id));
    } else {
      // Extract sizes from existing variants
      const seen = new Set<string>();
      product.variants.forEach((v) => {
        v.attributes.forEach((attr) => {
          if (
            attr.attributeValue.attribute.slug === "size" &&
            !seen.has(attr.attributeValue.id)
          ) {
            seen.add(attr.attributeValue.id);
            sizes.push({
              id: attr.attributeValue.id,
              value: attr.attributeValue.value,
            });
          }
        });
      });
    }

    // Always make sure CS (Custom Size) is the FIRST size option if present or in store sizes
    const csIndex = sizes.findIndex(
      (s) => s.value.toUpperCase() === "CS" || s.value.toLowerCase() === "custom size"
    );
    if (csIndex > 0) {
      const [cs] = sizes.splice(csIndex, 1);
      sizes.unshift(cs);
    } else if (csIndex === -1) {
      const csFromStore = allSizes.find(
        (s) => s.value.toUpperCase() === "CS" || s.value.toLowerCase() === "custom size"
      );
      if (csFromStore) {
        sizes.unshift(csFromStore);
      } else {
        sizes.unshift({ id: "cs_default_id", value: "CS" });
      }
    }

    return sizes;
  }, [product, allSizes]);

  // Initialize Matrix stock inputs state map: key = `${colorId || 'none'}_${sizeId || 'none'}`
  const initialStockState = useMemo(() => {
    const map: Record<string, number> = {};

    // Populate from existing variants
    product.variants.forEach((v) => {
      const colorAttr = v.attributes.find(
        (a) => a.attributeValue.attribute.slug === "color"
      );
      const sizeAttr = v.attributes.find(
        (a) => a.attributeValue.attribute.slug === "size"
      );

      const cId = colorAttr ? colorAttr.attributeValue.id : "none";
      const sId = sizeAttr ? sizeAttr.attributeValue.id : "none";
      map[`${cId}_${sId}`] = v.stock;
    });

    return map;
  }, [product]);

  const [matrixStock, setMatrixStock] = useState<Record<string, number>>(initialStockState);
  const [simpleStock, setSimpleStock] = useState<number>(product.stock);

  const handleStockChange = (colorId: string, sizeId: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    const key = `${colorId}_${sizeId}`;
    setMatrixStock((prev) => ({ ...prev, [key]: num }));
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    setErrorMsg("");
    setSavedSuccess(false);

    try {
      if (productColors.length > 0 || productSizes.length > 0) {
        const stockItems: {
          colorId: string | null;
          sizeId: string | null;
          stock: number;
          variantId?: string;
        }[] = [];

        if (productColors.length > 0 && productSizes.length > 0) {
          productColors.forEach((col) => {
            productSizes.forEach((sz) => {
              const key = `${col.id}_${sz.id}`;
              const stockVal = matrixStock[key] ?? 0;

              // Find variant matching col.id & sz.id if exists
              const matchedVariant = product.variants.find((v) => {
                const cId = v.attributes.find(
                  (a) => a.attributeValue.attribute.slug === "color"
                )?.attributeValue.id;
                const sId = v.attributes.find(
                  (a) => a.attributeValue.attribute.slug === "size"
                )?.attributeValue.id;
                return cId === col.id && sId === sz.id;
              });

              stockItems.push({
                colorId: col.id,
                sizeId: sz.id,
                stock: stockVal,
                variantId: matchedVariant?.id,
              });
            });
          });
        } else if (productColors.length > 0) {
          productColors.forEach((col) => {
            const key = `${col.id}_none`;
            const stockVal = matrixStock[key] ?? 0;
            const matchedVariant = product.variants.find((v) => {
              const cId = v.attributes.find(
                (a) => a.attributeValue.attribute.slug === "color"
              )?.attributeValue.id;
              return cId === col.id;
            });
            stockItems.push({
              colorId: col.id,
              sizeId: null,
              stock: stockVal,
              variantId: matchedVariant?.id,
            });
          });
        } else if (productSizes.length > 0) {
          productSizes.forEach((sz) => {
            const key = `none_${sz.id}`;
            const stockVal = matrixStock[key] ?? 0;
            const matchedVariant = product.variants.find((v) => {
              const sId = v.attributes.find(
                (a) => a.attributeValue.attribute.slug === "size"
              )?.attributeValue.id;
              return sId === sz.id;
            });
            stockItems.push({
              colorId: null,
              sizeId: sz.id,
              stock: stockVal,
              variantId: matchedVariant?.id,
            });
          });
        }

        const res = await updateProductStockMatrix(product.id, stockItems);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSavedSuccess(true);
          if (res.totalStock !== undefined) {
            setCurrentTotalStock(res.totalStock);
          }
          setTimeout(() => setSavedSuccess(false), 3000);
        }
      } else {
        // Simple overall product stock update
        const res = await updateSimpleProductStock(product.id, simpleStock);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setSavedSuccess(true);
          if (res.stock !== undefined) {
            setCurrentTotalStock(res.stock);
          }
          setTimeout(() => setSavedSuccess(false), 3000);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update stock.");
    } finally {
      setSaving(false);
    }
  };

  const hasVariantsOrOptions = productColors.length > 0 || productSizes.length > 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all">
      {/* Product Card Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={product.images[0]?.url || "/placeholder.png"}
            alt={product.name}
            className="w-14 h-14 object-cover rounded-lg border border-gray-200 shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-base truncate">
                {product.name}
              </h3>
              <Link
                href={`/admin/products/${product.id}`}
                className="text-xs text-[#A0463E] hover:underline font-semibold flex items-center gap-1 shrink-0"
              >
                Edit <ExternalLink size={12} />
              </Link>
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500">
              <span className="font-medium text-gray-700">₹{Number(product.price).toLocaleString("en-IN")}</span>
              <span>•</span>
              <span>
                Categories:{" "}
                {product.categories.length > 0
                  ? product.categories.map((c) => c.category.name).join(", ")
                  : "None"}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Badge & Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200">
          <div className="text-right">
            <p className="text-[11px] text-gray-500 uppercase font-semibold">Total Stock</p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                currentTotalStock === 0
                  ? "bg-red-100 text-red-700"
                  : currentTotalStock <= product.lowStockAlert
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {currentTotalStock === 0
                ? "0 (Out of Stock)"
                : currentTotalStock <= product.lowStockAlert
                ? `${currentTotalStock} (Low Stock)`
                : `${currentTotalStock} Units`}
            </span>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* Expanded Inventory Matrix */}
      {expanded && (
        <div className="p-4 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {hasVariantsOrOptions ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Color & Size Inventory Breakdown
                </p>
                <span className="text-[11px] text-gray-500">
                  Write stock count for each color & size option
                </span>
              </div>

              {/* Color x Size Grid Matrix */}
              {productColors.length > 0 && productSizes.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-xs">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-gray-100/80 border-b border-gray-200">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-700 sticky left-0 bg-gray-100 z-10">
                          Color / Size
                        </th>
                        {productSizes.map((sz) => (
                          <th
                            key={sz.id}
                            className={`p-3 font-bold text-center border-l border-gray-200 min-w-[70px] ${
                              sz.value.toUpperCase() === "CS" ? "bg-amber-50 text-amber-900" : "text-gray-800"
                            }`}
                          >
                            {sz.value}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productColors.map((color) => (
                        <tr key={color.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3 font-medium text-gray-800 sticky left-0 bg-white shadow-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                                style={{ backgroundColor: color.colorCode || "#CCC" }}
                              />
                              <span className="truncate max-w-[120px]">{color.value}</span>
                            </div>
                          </td>

                          {productSizes.map((sz) => {
                            const key = `${color.id}_${sz.id}`;
                            const stockVal = matrixStock[key] ?? 0;
                            return (
                              <td
                                key={sz.id}
                                className="p-2 border-l border-gray-200 text-center bg-gray-50/30"
                              >
                                <input
                                  type="number"
                                  min="0"
                                  value={stockVal}
                                  onChange={(e) =>
                                    handleStockChange(color.id, sz.id, e.target.value)
                                  }
                                  className={`w-16 px-2 py-1 text-center font-bold border rounded-md outline-none transition-all ${
                                    stockVal === 0
                                      ? "border-red-300 bg-red-50/50 text-red-700 focus:ring-2 focus:ring-red-400"
                                      : stockVal <= product.lowStockAlert
                                      ? "border-amber-300 bg-amber-50/50 text-amber-800 focus:ring-2 focus:ring-amber-400"
                                      : "border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#A0463E]"
                                  }`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Color Only Breakdown */}
              {productColors.length > 0 && productSizes.length === 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {productColors.map((color) => {
                    const key = `${color.id}_none`;
                    const stockVal = matrixStock[key] ?? 0;
                    return (
                      <div
                        key={color.id}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                            style={{ backgroundColor: color.colorCode || "#CCC" }}
                          />
                          <span className="text-xs font-semibold text-gray-800 truncate">
                            {color.value}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={stockVal}
                          onChange={(e) =>
                            handleStockChange(color.id, "none", e.target.value)
                          }
                          className="w-16 px-2 py-1 text-center text-xs font-bold border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#A0463E] outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Size Only Breakdown */}
              {productColors.length === 0 && productSizes.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {productSizes.map((sz) => {
                    const key = `none_${sz.id}`;
                    const stockVal = matrixStock[key] ?? 0;
                    return (
                      <div
                        key={sz.id}
                        className={`p-3 border rounded-xl flex flex-col items-center gap-1.5 ${
                          sz.value.toUpperCase() === "CS"
                            ? "bg-amber-50/60 border-amber-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <span className="text-xs font-bold text-gray-800">{sz.value}</span>
                        <input
                          type="number"
                          min="0"
                          value={stockVal}
                          onChange={(e) =>
                            handleStockChange("none", sz.id, e.target.value)
                          }
                          className="w-16 px-2 py-1 text-center text-xs font-bold border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-[#A0463E] outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Simple Stock Input (No Color / Size attributes specified yet) */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-800">Overall Product Stock</p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  This product does not have assigned colors or sizes yet. You can set stock directly or add store attributes under Edit Product.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">Stock:</span>
                <input
                  type="number"
                  min="0"
                  value={simpleStock}
                  onChange={(e) => setSimpleStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-bold text-center bg-white focus:ring-2 focus:ring-[#A0463E] outline-none"
                />
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                <Check size={16} className="text-emerald-600" /> Stock updated successfully!
              </span>
            )}

            <button
              onClick={handleSaveMatrix}
              disabled={saving}
              className="px-5 py-2 bg-[#A0463E] text-white text-xs font-semibold rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={14} /> Save Inventory Stock
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
