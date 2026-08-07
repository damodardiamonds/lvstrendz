import { db } from "@/lib/db";
import AttributeManager from "./components/AttributeManager";

export const metadata = {
  title: "Attributes & Colors | Admin - LV's Trendz",
};

export default async function AttributesPage() {
  const attributes = await db.attribute.findMany({
    include: {
      values: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Attributes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage available colors (with hex codes) and sizes for your products
        </p>
      </div>

      {/* Attribute Manager Component */}
      <AttributeManager attributes={attributes} />
    </div>
  );
}
