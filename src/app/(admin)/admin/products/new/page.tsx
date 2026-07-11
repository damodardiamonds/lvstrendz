
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductForm from "../components/ProductForm";
import { createProduct } from "../actions";

export const metadata = {
  title: "Add Product | Admin - LV's Trendz",
};

export default function NewProductPage() {
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
      <ProductForm action={createProduct} submitLabel="Create Product" />
    </div>
  );
}

