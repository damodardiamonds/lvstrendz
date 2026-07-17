// src/app/(shop)/product/[slug]/ProductDetailsClient.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Heart, ShoppingBag, Check, Truck, RotateCcw, ShieldCheck, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Module-level image cache
const imageCache: Record<string, HTMLImageElement> = {};


interface AttributeValue {
  id: string;
  value: string;
  slug: string;
  colorCode: string | null;
  attribute: {
    name: string;
    slug: string;
  };
}

interface VariantAttribute {
  attributeValue: AttributeValue;
}

interface Variant {
  id: string;
  sku: string | null;
  price: any;
  stock: number;
  isActive: boolean;
  attributes: VariantAttribute[];
  images: { id: string; url: string; alt: string | null }[];
}

interface ProductDetailsProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    shortDescription: string | null;
    sku: string | null;
    price: any;
    compareAtPrice: any;
    images: { id: string; url: string; alt: string | null }[];
    variants: Variant[];
  };
}

export default function ProductDetailsClient({ product }: ProductDetailsProps) {
  // Extract all unique sizes and colors from the active variants
  const sizes: { value: string; slug: string }[] = [];
  const colors: { value: string; slug: string; colorCode: string | null }[] = [];

  const seenSizes = new Set<string>();
  const seenColors = new Set<string>();

  product.variants.forEach((v) => {
    v.attributes.forEach((attrAttr) => {
      const attrVal = attrAttr.attributeValue;
      const attrName = attrVal.attribute.slug;

      if (attrName === 'size') {
        if (!seenSizes.has(attrVal.slug)) {
          seenSizes.add(attrVal.slug);
          sizes.push({ value: attrVal.value, slug: attrVal.slug });
        }
      } else if (attrName === 'color') {
        if (!seenColors.has(attrVal.slug)) {
          seenColors.add(attrVal.slug);
          colors.push({
            value: attrVal.value,
            slug: attrVal.slug,
            colorCode: attrVal.colorCode,
          });
        }
      }
    });
  });

  // Fallback to standard sizes if no size attribute values are explicitly defined for clothing items
  const isSaree = product.name.toLowerCase().includes('saree');
  if (sizes.length === 0 && !isSaree) {
    sizes.push(
      { value: 'CS', slug: 'cs' },
      { value: 'XS', slug: 'x-small' },
      { value: 'S', slug: 'small' },
      { value: 'M', slug: 'medium' },
      { value: 'L', slug: 'large' },
      { value: 'XL', slug: 'extra-large' },
      { value: 'XXL', slug: 'xx-large' }
    );
  }

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0]?.value || '');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.value || '');
  const [quantity, setQuantity] = useState(1);
  const [customBust, setCustomBust] = useState('');
  const [customWaist, setCustomWaist] = useState('');
  const [customHip, setCustomHip] = useState('');
  const [customShoulder, setCustomShoulder] = useState('');
  const [customNotes, setCustomNotes] = useState('');

  // Find the variant that matches selected size and color
  const selectedVariant = product.variants.find((v) => {
    const sizeVal = v.attributes.find((a) => a.attributeValue.attribute.slug === 'size')?.attributeValue.value;
    const colorVal = v.attributes.find((a) => a.attributeValue.attribute.slug === 'color')?.attributeValue.value;

    const sizeMatches = sizes.length === 0 || sizeVal === selectedSize || !sizeVal;
    const colorMatches = colors.length === 0 || colorVal === selectedColor;

    return sizeMatches && colorMatches;
  });

  // Aggregate all unique image URLs (parent + variant images) to show in thumbnails
  const allImages = [...product.images];
  product.variants.forEach((v) => {
    v.images.forEach((img) => {
      if (!allImages.some((i) => i.url === img.url)) {
        allImages.push(img);
      }
    });
  });

  // Filter images to show in the gallery based on the selected color
  const displayedImages = (() => {
    if (!selectedColor) return allImages;

    // Find all variants matching the selected color
    const matchingVariants = product.variants.filter((v) => {
      const colorVal = v.attributes.find((a) => a.attributeValue.attribute.slug === 'color')?.attributeValue.value;
      return colorVal === selectedColor;
    });

    // Gather all unique images from matching variants
    const variantImages: { id: string; url: string; alt: string | null }[] = [];
    matchingVariants.forEach((v) => {
      v.images.forEach((img) => {
        if (!variantImages.some((i) => i.url === img.url)) {
          variantImages.push(img);
        }
      });
    });

    // Fall back to allImages if no variant images are defined for this color
    return variantImages.length > 0 ? variantImages : allImages;
  })();

  // Track gallery image selection
  const [activeImage, setActiveImage] = useState<string>(
    displayedImages[0]?.url || '/images/placeholder.jpg'
  );

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);
  const [thumbPage, setThumbPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Index helper for next/prev sliding arrows
  const currentImageIndex = displayedImages.findIndex((img) => img.url === activeImage);

  const handleNextImage = () => {
    if (displayedImages.length === 0) return;
    const nextIndex = (currentImageIndex + 1) % displayedImages.length;
    setActiveImage(displayedImages[nextIndex].url);
  };

  const handlePrevImage = () => {
    if (displayedImages.length === 0) return;
    const prevIndex = (currentImageIndex - 1 + displayedImages.length) % displayedImages.length;
    setActiveImage(displayedImages[prevIndex].url);
  };

  // Detect mobile screen size on client
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const thumbsPerPage = isMobile ? 4 : 5;
  const totalThumbPages = Math.max(0, Math.ceil(displayedImages.length / thumbsPerPage) - 1);

  // Automatically update active image when color/size selection changes or active list resets
  useEffect(() => {
    // If the active image is no longer in the displayed images list, reset to the first one
    if (displayedImages.length > 0 && !displayedImages.some((img) => img.url === activeImage)) {
      setActiveImage(displayedImages[0].url);
    } else if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      // Otherwise, if the specific selected variant has images, prioritize showing its first image
      setActiveImage(selectedVariant.images[0].url);
    }
  }, [selectedColor, selectedSize, displayedImages, activeImage, selectedVariant]);

  // Preload first 3 images on variation/displayedImages change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    displayedImages.slice(0, 3).forEach((img) => {
      if (img.url && !imageCache[img.url]) {
        const p = new window.Image();
        p.src = img.url;
        imageCache[img.url] = p;
      }
    });
  }, [displayedImages]);

  // Lazy preload nearby images (activeIndex + 1, activeIndex + 2, activeIndex - 1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const activeIndex = displayedImages.findIndex((img) => img.url === activeImage);
    if (activeIndex === -1) return;

    const preload = () => {
      const toPreload = [activeIndex + 1, activeIndex + 2, activeIndex - 1];
      toPreload.forEach((idx) => {
        if (idx >= 0 && idx < displayedImages.length) {
          const url = displayedImages[idx].url;
          if (url && !imageCache[url]) {
            const img = new window.Image();
            img.src = url;
            imageCache[url] = img;
          }
        }
      });
    };

    if ('requestIdleCallback' in window) {
      const handle = (window as any).requestIdleCallback(preload);
      return () => (window as any).cancelIdleCallback(handle);
    } else {
      const timer = setTimeout(preload, 1000);
      return () => clearTimeout(timer);
    }
  }, [activeImage, displayedImages]);

  // Handle touch gestures for mobile swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.changedTouches[0].screenX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNextImage();
      } else {
        handlePrevImage();
      }
    }
    setTouchStartX(null);
  };

  // Keyboard navigation arrow keys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedImages, currentImageIndex]);

  // Keep thumbnail scroll page aligned with the currently active image index
  useEffect(() => {
    if (displayedImages.length === 0) return;
    const newPage = Math.floor(currentImageIndex / thumbsPerPage);
    if (newPage !== thumbPage && newPage >= 0 && newPage <= totalThumbPages) {
      setThumbPage(newPage);
    }
  }, [currentImageIndex, thumbsPerPage, totalThumbPages, thumbPage, displayedImages.length]);

  // Smooth scroll thumbnail strip when the target scroll page changes
  useEffect(() => {
    const container = thumbnailContainerRef.current;
    if (!container || !container.children.length) return;

    const firstChild = container.children[0] as HTMLElement;
    if (!firstChild) return;
    const thumbWidth = firstChild.offsetWidth;
    const gap = isMobile ? 6 : 8;
    const scrollPos = thumbPage * thumbsPerPage * (thumbWidth + gap);

    container.scrollTo({ left: scrollPos, behavior: 'smooth' });
  }, [thumbPage, thumbsPerPage, isMobile]);

  const activePrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
  const activeComparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;
  
  const discountPercent = activeComparePrice && activeComparePrice > activePrice
    ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    // Validation for custom tailoring
    if (selectedSize === 'CS' || selectedSize === 'Custom Size') {
      if (!customBust.trim() || !customWaist.trim() || !customHip.trim() || !customShoulder.trim()) {
        toast.error("Please fill in required measurements (Bust, Waist, Hip, Shoulder) for Custom Size tailoring.", {
          style: {
            background: '#3D1515',
            color: '#fff',
          },
        });
        return;
      }
    }

    // Load existing cart items
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('lvstrendz_cart') || '[]');
    } catch (e) {
      cart = [];
    }

    // Add selected item details
    const cartItem = {
      productId: product.id,
      name: product.name,
      variantId: selectedVariant?.id || null,
      sku: selectedVariant?.sku || product.sku,
      price: activePrice,
      quantity,
      size: selectedSize === 'CS' ? 'Custom Size' : selectedSize || null,
      color: selectedColor || null,
      image: activeImage,
      customMeasurements: (selectedSize === 'CS' || selectedSize === 'Custom Size') ? {
        bust: customBust.trim(),
        waist: customWaist.trim(),
        hip: customHip.trim(),
        shoulder: customShoulder.trim(),
        notes: customNotes.trim()
      } : null
    };

    // Check if duplicate item exists
    const existingIdx = cart.findIndex(
      (item: any) =>
        item.productId === cartItem.productId &&
        item.variantId === cartItem.variantId &&
        JSON.stringify(item.customMeasurements) === JSON.stringify(cartItem.customMeasurements)
    );

    if (existingIdx !== -1) {
      cart[existingIdx].quantity += quantity;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem('lvstrendz_cart', JSON.stringify(cart));
    
    // Dispatch custom event to notify header cart icon of updates
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.success(`${product.name} added to cart successfully!`, {
      style: {
        background: '#3D1515',
        color: '#fff',
      },
    });

    // Reset tailoring inputs
    setCustomBust('');
    setCustomWaist('');
    setCustomHip('');
    setCustomShoulder('');
    setCustomNotes('');
  };

  return (
    <div className="bg-white min-h-screen py-10 px-4 md:px-8 lg:px-16 max-w-[1440px] mx-auto">
      <Toaster position="top-right" reverseOrder={false} />

      {/* Breadcrumbs */}
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-8">
        <a href="/" className="hover:text-black">Home</a>
        <span className="mx-2">/</span>
        <a href="/shop" className="hover:text-black">Shop</a>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative aspect-[3/4] md:aspect-[4/5] w-full bg-[#f8f8f8] overflow-hidden border border-gray-100 group"
          >
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              className="object-cover object-center cursor-default transition-opacity duration-150"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-[#A0463E] text-white font-bold uppercase tracking-wide text-xs px-3 py-1.5 z-10">
                {discountPercent}% Off
              </span>
            )}

            {/* Slide Navigation Arrows */}
            {displayedImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-[100] w-9 h-9 md:w-11 md:h-11 bg-white/90 text-[#333] hover:bg-[#333] hover:text-white flex items-center justify-center rounded-full border-none shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-[0.92] cursor-pointer"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-[100] w-9 h-9 md:w-11 md:h-11 bg-white/90 text-[#333] hover:bg-[#333] hover:text-white flex items-center justify-center rounded-full border-none shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-200 active:scale-[0.92] cursor-pointer"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {displayedImages.length > 1 && (
            <div className="relative mt-3 px-9 md:px-10 lg:px-11">
              {/* Thumbnail Nav Prev */}
              <button
                type="button"
                onClick={() => setThumbPage((p) => Math.max(0, p - 1))}
                disabled={thumbPage <= 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 md:w-8 md:h-8 lg:w-[34px] lg:h-[34px] border-none bg-transparent text-[#111] hover:shadow-md hover:bg-white/10 flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:shadow-none"
                aria-label="Previous thumbnails"
              >
                <ChevronLeft size={isMobile ? 16 : 20} className="stroke-[2.5]" />
              </button>

              {/* Thumbnail Slider */}
              <div
                ref={thumbnailContainerRef}
                className="flex flex-row flex-nowrap gap-[6px] md:gap-2 overflow-hidden scroll-smooth py-1.5"
              >
                {displayedImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img.url)}
                    className={`relative flex-shrink-0 w-[calc((100%-18px)/4)] md:w-[calc((100%-32px)/5)] aspect-[4/5] bg-gray-50 overflow-hidden border-2 rounded-md transition-all duration-200 cursor-pointer ${
                      activeImage === img.url
                        ? 'border-[#333] shadow-[0_0_0_1px_#333]'
                        : 'border-transparent hover:border-[#999]'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || product.name}
                      fill
                      className="object-cover object-center cursor-default transition-opacity duration-150"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>

              {/* Thumbnail Nav Next */}
              <button
                type="button"
                onClick={() => setThumbPage((p) => Math.min(totalThumbPages, p + 1))}
                disabled={thumbPage >= totalThumbPages}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 md:w-8 md:h-8 lg:w-[34px] lg:h-[34px] border-none bg-transparent text-[#111] hover:shadow-md hover:bg-white/10 flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-90 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:shadow-none"
                aria-label="Next thumbnails"
              >
                <ChevronRight size={isMobile ? 16 : 20} className="stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Details & Actions */}
        <div className="lg:col-span-5 flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-black leading-tight mb-4 uppercase tracking-wide">
            {product.name}
          </h1>

          {/* Sku */}
          {product.sku && (
            <p className="text-xs text-gray-400 tracking-wider mb-4 uppercase">
              SKU: {selectedVariant?.sku || product.sku}
            </p>
          )}

          {/* Pricing */}
          <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-6">
            <span className="text-2xl md:text-3xl font-black text-black">
              ₹{activePrice.toLocaleString()}
            </span>
            {activeComparePrice && activeComparePrice > activePrice && (
              <span className="text-lg text-gray-400 line-through">
                ₹{activeComparePrice.toLocaleString()}
              </span>
            )}
            
            {/* Stock Status */}
            <span className={`ml-auto text-xs uppercase tracking-widest font-semibold ${
              isOutOfStock ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {isOutOfStock ? '● Out of Stock' : '● In Stock'}
            </span>
          </div>

          {/* Size Guide Link */}
          <div className="mb-4">
            <a
              href="https://lvstrendz.com/wp-content/uploads/2026/06/Size-Guide-LVS.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-800 hover:text-[#A0463E] transition-colors"
            >
              📏 Size Guide
            </a>
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <div 
              className="text-gray-600 text-sm leading-relaxed mb-6"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          {/* Swatches Section */}
          <div className="space-y-6 border-b border-gray-100 pb-6 mb-6">
            {/* Color Swatch */}
            {colors.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-black mb-3">
                  Color: <span className="text-gray-500 font-medium normal-case">{selectedColor}</span>
                </h3>
                <div className="flex gap-3">
                  {colors.map((color) => (
                    <button
                      key={color.slug}
                      onClick={() => setSelectedColor(color.value)}
                      className={`relative w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                        selectedColor === color.value
                          ? 'border-black ring-1 ring-black scale-105'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.colorCode || '#ddd' }}
                      title={color.value}
                    >
                      {selectedColor === color.value && (
                        <Check 
                          size={14} 
                          className={color.colorCode && ['#ffffff', '#fff'].includes(color.colorCode.toLowerCase()) ? 'text-black' : 'text-white'} 
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Swatch */}
            {sizes.length > 0 && (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2 border-t border-gray-100 pt-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs uppercase tracking-wider font-bold text-black min-w-[50px]">Size</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {sizes.map((size) => (
                      <button
                        key={size.slug}
                        onClick={() => setSelectedSize(size.value)}
                        className={`w-10 h-10 text-[11px] font-semibold border flex items-center justify-center transition-all rounded-full ${
                          selectedSize === size.value
                            ? 'bg-[#3D1515] border-[#3D1515] text-white'
                            : 'bg-white border-gray-300 text-gray-800 hover:border-black'
                        }`}
                      >
                        {size.value === 'CS' || size.slug === 'cs' ? 'CS' : size.value}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Custom Size Toggle Link */}
                <button
                  type="button"
                  onClick={() => setSelectedSize('CS')}
                  className="flex items-center gap-1.5 text-xs font-extrabold text-[#111] hover:text-[#A0463E] border-none bg-transparent cursor-pointer whitespace-nowrap self-start md:self-auto"
                >
                  <span>Custom Size</span>
                  <img src="/images/sewing-machine.webp" alt="Sewing Machine" className="w-5 h-5 object-contain" />
                </button>
              </div>
            )}

            {/* Custom Measurements Fields */}
            {(selectedSize === 'CS' || selectedSize === 'Custom Size') && (
              <div className="mt-4 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50/50 space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <div className="w-6 h-6 bg-[#A0463E]/10 rounded-full flex items-center justify-center text-[#A0463E] p-1 shrink-0">
                    <img src="/images/sewing-machine.webp" alt="Sewing Machine" className="w-4 h-4 object-contain" />
                  </div>
                  <h4 className="text-xs uppercase tracking-wider font-bold text-black">
                    Custom Tailoring Specifications
                  </h4>
                </div>
                <p className="text-[10px] text-gray-500 leading-normal">
                  Provide your measurements below in inches. Custom tailoring adds 5–8 business days to tailoring and processing.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Bust (inch) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customBust}
                      onChange={(e) => setCustomBust(e.target.value)}
                      placeholder="Bust (inch)"
                      className="w-full px-3 py-2 border border-gray-205 rounded text-xs bg-white focus:outline-none focus:border-[#A0463E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Waist (inch) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customWaist}
                      onChange={(e) => setCustomWaist(e.target.value)}
                      placeholder="Waist (inch)"
                      className="w-full px-3 py-2 border border-gray-205 rounded text-xs bg-white focus:outline-none focus:border-[#A0463E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Hip (inch) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customHip}
                      onChange={(e) => setCustomHip(e.target.value)}
                      placeholder="Hip (inch)"
                      className="w-full px-3 py-2 border border-gray-205 rounded text-xs bg-white focus:outline-none focus:border-[#A0463E]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Shoulder (inch) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={customShoulder}
                      onChange={(e) => setCustomShoulder(e.target.value)}
                      placeholder="Shoulder (inch)"
                      className="w-full px-3 py-2 border border-gray-205 rounded text-xs bg-white focus:outline-none focus:border-[#A0463E]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                    Special Note (optional)
                  </label>
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Special Note (optional)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-205 rounded text-xs bg-white focus:outline-none focus:border-[#A0463E] resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quantity & Cart button */}
          <div className="flex gap-4 mb-8">
            <div className="flex items-center border border-gray-300 h-12 bg-white">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-10 text-gray-500 hover:text-black font-semibold h-full flex items-center justify-center transition-colors"
                disabled={isOutOfStock}
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-sm text-black">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-10 text-gray-500 hover:text-black font-semibold h-full flex items-center justify-center transition-colors"
                disabled={isOutOfStock}
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`flex-1 h-12 flex items-center justify-center gap-2.5 text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                isOutOfStock
                  ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                  : 'bg-[#A0463E] hover:bg-[#853a33] active:scale-98 shadow-md hover:shadow-lg'
              }`}
            >
              <ShoppingBag size={16} />
              Add to Cart
            </button>

            <button 
              aria-label="Add to Wishlist"
              className="w-12 h-12 border border-gray-300 flex items-center justify-center text-gray-700 hover:text-[#A0463E] hover:border-[#A0463E] transition-all duration-300 rounded-none bg-white"
            >
              <Heart size={18} />
            </button>
          </div>

          {/* Trust points */}
          <div className="space-y-4 border-t border-gray-100 pt-6 mb-6">
            <div className="flex items-center gap-3 text-xs text-gray-700">
              <Truck size={18} className="text-[#A0463E]" />
              <span>Free Delivery on all orders across India</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-700">
              <RotateCcw size={18} className="text-[#A0463E]" />
              <span>Easy 7 Days Returns and Exchanges</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-700">
              <ShieldCheck size={18} className="text-[#A0463E]" />
              <span>100% Secure Checkout with Trusted Payment Gateways</span>
            </div>
          </div>

          {/* Long Description (Collapse/Expand style or standard) */}
          {product.description && (
            <div className="border-t border-gray-100 pt-6 mt-2">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-black mb-4">
                Product Specifications
              </h3>
              <div 
                className="prose prose-sm text-gray-700 leading-relaxed max-w-none text-xs space-y-4 font-normal"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
