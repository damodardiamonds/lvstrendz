// src/app/(shop)/product/[slug]/ProductDetailsClient.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Heart, ShoppingBag, Check, Truck, RotateCcw, ShieldCheck, Star } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

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

  const [selectedSize, setSelectedSize] = useState<string>(sizes[0]?.value || '');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.value || '');
  const [quantity, setQuantity] = useState(1);

  // Find the variant that matches selected size and color
  const selectedVariant = product.variants.find((v) => {
    const sizeVal = v.attributes.find((a) => a.attributeValue.attribute.slug === 'size')?.attributeValue.value;
    const colorVal = v.attributes.find((a) => a.attributeValue.attribute.slug === 'color')?.attributeValue.value;

    const sizeMatches = sizes.length === 0 || sizeVal === selectedSize;
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

    // 1. Gather all image URLs that belong to variants of OTHER colors
    const otherColorImageUrls = new Set<string>();
    product.variants.forEach((v) => {
      const colorVal = v.attributes.find((a) => a.attributeValue.attribute.slug === 'color')?.attributeValue.value;
      if (colorVal && colorVal !== selectedColor) {
        v.images.forEach((img) => otherColorImageUrls.add(img.url));
      }
    });

    // 2. Gather all image URLs that belong to variants of the SELECTED color
    const selectedColorImageUrls = new Set<string>();
    product.variants.forEach((v) => {
      const colorVal = v.attributes.find((a) => a.attributeValue.attribute.slug === 'color')?.attributeValue.value;
      if (colorVal === selectedColor) {
        v.images.forEach((img) => selectedColorImageUrls.add(img.url));
      }
    });

    // 3. Filter allImages:
    // Keep an image if it belongs to selected color variants,
    // OR if it is NOT specifically assigned to variants of other colors (like general details, size charts, or close-ups)
    const filtered = allImages.filter((img) => {
      if (selectedColorImageUrls.has(img.url)) return true;
      if (otherColorImageUrls.has(img.url)) return false;
      return true; // Keep parent images not linked to other colors
    });

    return filtered.length > 0 ? filtered : allImages;
  })();

  // Track gallery image selection
  const [activeImage, setActiveImage] = useState<string>(
    displayedImages[0]?.url || '/images/placeholder.jpg'
  );

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

  const activePrice = selectedVariant ? Number(selectedVariant.price) : Number(product.price);
  const activeComparePrice = product.compareAtPrice ? Number(product.compareAtPrice) : null;
  const isOutOfStock = selectedVariant ? selectedVariant.stock <= 0 : false;
  
  const discountPercent = activeComparePrice && activeComparePrice > activePrice
    ? Math.round(((activeComparePrice - activePrice) / activeComparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

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
      size: selectedSize || null,
      color: selectedColor || null,
      image: activeImage,
    };

    // Check if duplicate item exists
    const existingIdx = cart.findIndex(
      (item: any) =>
        item.productId === cartItem.productId && item.variantId === cartItem.variantId
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
          <div className="relative aspect-[3/4] w-full bg-gray-50 overflow-hidden border border-gray-100">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-[#A0463E] text-white font-bold uppercase tracking-wide text-xs px-3 py-1.5 z-10">
                {discountPercent}% Off
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {displayedImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto py-2 scrollbar-thin">
              {displayedImages.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.url)}
                  className={`relative flex-shrink-0 w-20 h-24 bg-gray-50 overflow-hidden border transition-all ${
                    activeImage === img.url ? 'border-black ring-1 ring-black' : 'border-gray-200'
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
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
              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-black mb-3">
                  Size: <span className="text-gray-500 font-medium">{selectedSize}</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {sizes.map((size) => (
                    <button
                      key={size.slug}
                      onClick={() => setSelectedSize(size.value)}
                      className={`min-w-[44px] h-10 px-3 text-xs font-semibold border flex items-center justify-center transition-all ${
                        selectedSize === size.value
                          ? 'bg-[#3D1515] border-[#3D1515] text-white scale-102'
                          : 'bg-white border-gray-300 text-gray-800 hover:border-black'
                      }`}
                    >
                      {size.value}
                    </button>
                  ))}
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
