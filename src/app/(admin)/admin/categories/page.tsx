import { db } from "@/lib/db";
import CategoryList from "./components/CategoryList";

export const metadata = {
  title: "Categories | Admin - LV's Trendz",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    include: {
      parent: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage product categories and storefront collections
        </p>
      </div>

      <CategoryList categories={categories} />
    </div>
  );
}
