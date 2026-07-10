
import Link from "next/link";

const categories = [
  { name: "Lehenga Choli", slug: "lehenga-choli", emoji: "👗" },
  { name: "Ethnic Gowns", slug: "ethnic-gown", emoji: "✨" },
  { name: "Kurtis", slug: "kurtis", emoji: "🌸" },
  { name: "Sarees", slug: "saree-studio", emoji: "🪷" },
  { name: "Dresses", slug: "dresses", emoji: "💃" },
  { name: "Party Wear", slug: "party-wear", emoji: "🎉" },
];

export default function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Shop by Category
        </h2>
        <p className="text-gray-600 mt-2">Find your perfect ethnic wear</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/category/${cat.slug}`}
            className="group flex flex-col items-center p-6 bg-gray-50 rounded-xl hover:bg-[#A0463E] hover:text-white transition-all duration-300"
          >
            <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">
              {cat.emoji}
            </span>
            <span className="text-sm font-medium text-center">{cat.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

