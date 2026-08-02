export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-4 border-b border-gray-100">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-[1470px] mx-auto px-4 md:px-[45px] py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Gallery Skeleton (Left 7 Cols) */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
            {/* Thumbnails list skeleton */}
            <div className="hidden md:flex flex-col gap-3 w-20">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            {/* Main Image Skeleton */}
            <div className="flex-1 aspect-[3/4] bg-gray-200 rounded-xl"></div>
          </div>

          {/* Product Details Skeleton (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & SKU */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>

            {/* Price Skeleton */}
            <div className="h-10 bg-gray-200 rounded w-40"></div>

            <div className="border-t border-b border-gray-100 py-6 space-y-6">
              {/* Color options skeleton */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="flex gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-9 h-9 bg-gray-200 rounded-full"></div>
                  ))}
                </div>
              </div>

              {/* Size options skeleton */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-12 h-10 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="space-y-3 pt-2">
              <div className="h-14 bg-gray-200 rounded-xl w-full"></div>
              <div className="h-14 bg-gray-200 rounded-xl w-full"></div>
            </div>

            {/* Service badges skeleton */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
