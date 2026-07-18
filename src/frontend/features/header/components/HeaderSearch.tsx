"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

type ProductResult = {
  id: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  image: string;
};

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductResult[]>([]);
  const [popular, setPopular] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { format } = useCurrency();

  // Load popular products on mount
  useEffect(() => {
    fetch("/api/search")
      .then((res) => res.json())
      .then((data) => {
        setPopular(data.popular || []);
      })
      .catch((err) => console.error("Error loading popular products:", err));
  }, []);

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.products || []);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Search fetch error:", err);
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const handleTrendingClick = (term: string) => {
    setQuery(term);
    router.push(`/shop?search=${encodeURIComponent(term)}`);
    setIsOpen(false);
  };

  const handleProductClick = () => {
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-[280px] elbzotech-search-wrap-global elbzotech-search-global-default elbzotech-search-global-style4 live-search-yes ${
        isOpen ? "active" : ""
      }`}
    >
      <div className="elbzotech-search-form-wrap-global">
        <form
          onSubmit={handleSearchSubmit}
          className="elbzotech-search-global-form flex-wrapper align_items-stretch relative"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Enter key to search"
            className="w-full rounded-md border border-gray-300 py-2.5 pl-4 pr-10 text-[13px] text-gray-700 placeholder-gray-400 outline-none transition-colors focus:border-[#A0463E]"
            autoComplete="off"
          />
          <input type="hidden" name="post_type" value="product" />
          <div className="elbzotech-submit-form absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
            {loading ? (
              <Loader2 className="animate-spin text-gray-400" size={16} />
            ) : (
              <button
                type="submit"
                aria-label="Search"
                className="elbzotech-text-bt-search text-gray-500 hover:text-[#A0463E] transition-colors"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Live Search Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-2 w-[420px] bg-white border border-gray-200 shadow-2xl rounded-lg z-[999] overflow-hidden js-list-live-search elbzotech-list-product-search box-live-e display-list"
          style={{ maxHeight: "480px" }}
        >
          <div className="list-search-default p-4 overflow-y-auto max-h-[470px]">
            {/* If no query, show default content: Trending Now and Popular Products */}
            {!query.trim() ? (
              <>
                {/* Trending Now */}
                <div className="key-trending mb-4">
                  <h3 className="key-trending-title title16 font-bold text-uppercase text-gray-800 border-b border-gray-100 pb-1.5 mb-2.5 flex items-center gap-1.5">
                    <span>Trending Now</span>
                  </h3>
                  <div className="key-trending-list flex flex-wrap gap-2">
                    {["Anarkali", "Gown", "Lehenga Choli", "Saree"].map(
                      (term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleTrendingClick(term)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-black rounded-full text-xs font-medium border border-gray-200 transition-colors"
                        >
                          <Search size={12} strokeWidth={2} />
                          {term}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Popular Products */}
                {popular.length > 0 && (
                  <div className="elbzotech-products-wrap js-content-wrap shop-grid-product-item-">
                    <h3 className="search-popular-title title16 font-bold text-uppercase text-gray-800 border-b border-gray-100 pb-1.5 mb-3 flex items-center">
                      Popular Products
                    </h3>
                    <div className="js-content-main list-product-wrap bzotech-row flex flex-col gap-3">
                      {popular.map((product) => (
                        <div
                          key={product.id}
                          className="item-search-pro flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                        >
                          <div className="search-ajax-thumb product-thumb shrink-0">
                            <Link
                              href={`/product/${product.slug}`}
                              onClick={handleProductClick}
                              className="product-thumb-link block relative w-[60px] h-[60px] overflow-hidden rounded border border-gray-100"
                            >
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="60px"
                                className="object-cover"
                              />
                            </Link>
                          </div>
                          <div className="search-ajax-title flex-1 min-w-0">
                            <h3 className="title14 text-[13px] font-semibold text-gray-800 hover:text-[#A0463E] transition-colors truncate">
                              <Link
                                href={`/product/${product.slug}`}
                                onClick={handleProductClick}
                              >
                                {product.name}
                              </Link>
                            </h3>
                            <div className="search-ajax-price mt-0.5">
                              <div className="product-price price flex items-center gap-1.5 text-xs">
                                <span className="woocommerce-Price-amount amount font-bold text-[#A0463E]">
                                  <bdi>
                                    {format(product.price)}
                                  </bdi>
                                </span>
                                {product.originalPrice && (
                                  <span className="text-gray-400 line-through text-[11px]">
                                    {format(product.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Search Results */
              <div className="elbzotech-products-wrap js-content-wrap shop-grid-product-item-">
                <h3 className="search-results-title title16 font-bold text-uppercase text-gray-800 border-b border-gray-100 pb-1.5 mb-3">
                  Product Results
                </h3>
                {results.length > 0 ? (
                  <div className="content-list-product-search js-content-main list-product-wrap bzotech-row flex flex-col gap-3">
                    {results.map((product) => (
                      <div
                        key={product.id}
                        className="item-search-pro flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                      >
                        <div className="search-ajax-thumb product-thumb shrink-0">
                          <Link
                            href={`/product/${product.slug}`}
                            onClick={handleProductClick}
                            className="product-thumb-link block relative w-[60px] h-[60px] overflow-hidden rounded border border-gray-100"
                          >
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="60px"
                              className="object-cover"
                            />
                          </Link>
                        </div>
                        <div className="search-ajax-title flex-1 min-w-0">
                          <h3 className="title14 text-[13px] font-semibold text-gray-800 hover:text-[#A0463E] transition-colors truncate">
                            <Link
                              href={`/product/${product.slug}`}
                              onClick={handleProductClick}
                            >
                              {product.name}
                            </Link>
                          </h3>
                          <div className="search-ajax-price mt-0.5">
                            <div className="product-price price flex items-center gap-1.5 text-xs">
                              <span className="woocommerce-Price-amount amount font-bold text-[#A0463E]">
                                <bdi>
                                  {format(product.price)}
                                </bdi>
                              </span>
                              {product.originalPrice && (
                                <span className="text-gray-400 line-through text-[11px]">
                                  {format(product.originalPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-gray-500">
                    {loading ? "Searching..." : `No products found for "${query}"`}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
