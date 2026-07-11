
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import VariantList from "./components/VariantList";
import AddVariantForm from "./components/AddVariantForm";

interface VariantsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VariantsPage({ params }: VariantsPageProps) {
  const { id } = await params;

  const product = await db.product.findUnique({
    where: { id },
    include: {
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
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // Get all available attributes and their values
  const attributes = await db.attribute.findMany({
    include: {
      values: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin/products/${id}`}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Variants</h1>
          <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Variants</p>
          <p className="text-2xl font-bold text-gray-900">
            {product.variants.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Stock (all variants)</p>
          <p className="text-2xl font-bold text-gray-900">
            {product.variants.reduce((sum, v) => sum + v.stock, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Low Stock Variants</p>
          <p className="text-2xl font-bold text-red-600">
            {product.variants.filter((v) => v.stock <= 5).length}
          </p>
        </div>
      </div>

      {/* Add Variant Form */}
      <AddVariantForm productId={id} attributes={attributes} />

      {/* Existing Variants */}
      <VariantList variants={product.variants} productId={id} />
    </div>
  );
}

