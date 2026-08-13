
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import VariantList from "./components/VariantList";
import AddVariantForm from "./components/AddVariantForm";
import AttributeManager from "@/app/(admin)/admin/attributes/components/AttributeManager";

interface VariantsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function VariantsPage({ params, searchParams }: VariantsPageProps) {
  const { id } = await params;
  const { page } = (await searchParams) || {};
  const backHref = `/admin/products/${id}${page ? `?page=${page}` : ""}`;

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
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Product Attributes & Stock</h1>
          <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
        </div>
      </div>

      {/* Attributes (Colors & Sizes) Manager */}
      <AttributeManager attributes={attributes} />

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Variants / Combinations</p>
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
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600">
            {product.variants.filter((v) => v.stock <= 5).length}
          </p>
        </div>
      </div>

      {/* Add Variant / Combination Form */}
      <AddVariantForm productId={id} attributes={attributes} />

      {/* Existing Variants List */}
      <VariantList variants={product.variants} productId={id} />
    </div>
  );
}

