
import Link from "next/link";
import { Decimal } from "@prisma/client/runtime/library";

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number | Decimal;
  compareAtPrice?: number | Decimal | null;
  image?: string;
  category?: string;
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  image,
  category,
}: ProductCardProps) {
  const numericPrice = Number(price);
  const numericCompareAt = compareAtPrice ? Number(compareAtPrice) : null;

  return (
    <Link
      href={`/products/${slug}`}
      className="group block rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
    >
      <div className="aspect-square relative bg-gray-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        {category && (
          <p className="text-xs text-gray-500 mb-1">{category}</p>
        )}
        <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">
            ₹{numericPrice.toLocaleString()}
          </span>
          {numericCompareAt && numericCompareAt > numericPrice && (
            <span className="text-sm text-gray-400 line-through">
              ₹{numericCompareAt.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

