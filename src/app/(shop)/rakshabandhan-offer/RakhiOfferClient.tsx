'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Gift,
  ShoppingBag,
  Clock,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  CheckCircle2,
  ChevronRight,
  Zap,
  ArrowRight,
  Lock,
  Heart,
  Tag,
  Info,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useCurrency } from '@/context/CurrencyContext';
import { trackAddToCart, trackInitiateCheckout } from '@/lib/metaPixel';

interface ProductProp {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  description: string | null;
  images: { id: string; url: string; alt: string | null }[];
  selectedSizes: { id: string; value: string; slug: string }[];
  selectedColors: { id: string; value: string; slug: string; colorCode: string | null }[];
  variants: any[];
}

interface MoreProductProp {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
  category?: string;
}

export default function RakhiOfferClient({
  product,
  moreProducts = [],
}: {
  product: ProductProp;
  moreProducts?: MoreProductProp[];
}) {
  const { format } = useCurrency();
  const router = useRouter();

  // Active Tab: 'gift-card' | 'product'
  const [activeOfferTab, setActiveOfferTab] = useState<'gift-card' | 'product'>('product');

  // Product Selection States
  const [selectedSize, setSelectedSize] = useState<string>('M (38)');
  const [selectedColor, setSelectedColor] = useState<string>('Maroon / Wine');
  const [activeImage, setActiveImage] = useState<string>(
    product.images[0]?.url || 'https://res.cloudinary.com/n5umtsub/image/upload/v1784182822/lvstrendz/products/B4-1784182822219-xx9nqn.webp'
  );

  // Direct Gift Card Form States
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [isBuyingGiftCard, setIsBuyingGiftCard] = useState(false);

  // Countdown Timer State ending 27th August 2026 midnight 11:59 PM IST
  const TARGET_DATE = new Date('2026-08-27T23:59:59+05:30').getTime();

  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const difference = TARGET_DATE - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-set RAKHI500 coupon code so it applies to any product purchased from the website
  useEffect(() => {
    const rakhiCoupon = {
      code: 'RAKHI500',
      name: 'Rakshabandhan ₹500 Off',
      type: 'FIXED',
      value: 500,
      nonStackable: true,
    };
    localStorage.setItem('lvstrendz_coupon', JSON.stringify(rakhiCoupon));
  }, []);

  // Direct Product Purchase with ₹500 Instant Rakhi OFF
  const handleBuyProductDirect = () => {
    const discountPrice = Math.max(0, product.price - 500);

    const cartItem = {
      productId: product.id,
      variantId: product.variants[0]?.id || null,
      name: product.name,
      slug: product.slug,
      price: product.price, // Base price
      discountedPrice: discountPrice,
      image: activeImage,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      customMeasurements: null,
    };

    // Save to cart
    const existingCart = JSON.parse(localStorage.getItem('lvstrendz_cart') || '[]');
    const existingIdx = existingCart.findIndex(
      (item: any) => item.productId === cartItem.productId && item.size === cartItem.size
    );

    if (existingIdx !== -1) {
      existingCart[existingIdx].quantity += 1;
    } else {
      existingCart.push(cartItem);
    }
    localStorage.setItem('lvstrendz_cart', JSON.stringify(existingCart));

    // Save Direct ₹500 OFF Coupon in localStorage (non-stackable with gift card)
    const rakhiCoupon = {
      code: 'RAKHI500',
      name: 'Rakshabandhan Direct ₹500 Off',
      type: 'FIXED',
      value: 500,
      nonStackable: true,
    };
    localStorage.setItem('lvstrendz_coupon', JSON.stringify(rakhiCoupon));

    // Dispatch update for header
    window.dispatchEvent(new Event('cartUpdated'));

    // Track Pixel
    trackAddToCart({
      id: product.id,
      name: product.name,
      price: discountPrice,
      quantity: 1,
    });
    trackInitiateCheckout({ items: [cartItem], value: discountPrice });

    toast.success('Instant ₹500 Rakhi Discount applied! Redirecting to checkout...', {
      style: { background: '#1a4223', color: '#fff' },
    });

    setTimeout(() => {
      router.push('/checkout');
    }, 800);
  };

  // Direct Gift Card Purchase Handler (Pay ₹500 get ₹1000 Value)
  const handleBuyGiftCardDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      toast.error('Please enter a valid email address to receive your ₹1,000 Voucher Code.');
      return;
    }

    setIsBuyingGiftCard(true);
    toast.loading('Preparing ₹1,000 Gift Voucher payment...', { id: 'rakhi-gc' });

    try {
      // First fetch active offers to get ₹1000 for ₹500 offer ID
      const offersRes = await fetch('/api/gift-cards/active-offers');
      const offersData = await offersRes.json();
      const targetOffer = offersData.offers?.find((o: any) => Number(o.price) === 500) || offersData.offers?.[0];

      if (!targetOffer) {
        // Redirect to gift-card page if direct api offer configuration is pending
        router.push('/gift-card');
        return;
      }

      const payload = {
        offerId: targetOffer.id,
        email: buyerEmail.trim(),
        purchasedBy: buyerName.trim() || buyerEmail.trim(),
        isGift: false,
        sharedVia: 'email',
      };

      const res = await fetch('/api/gift-cards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.giftCard) {
        toast.success('🎉 ₹1,000 Gift Voucher Generated Successfully!', { id: 'rakhi-gc' });
        const gc = data.giftCard;
        const query = new URLSearchParams({
          code: gc.code,
          value: String(gc.value),
          senderName: buyerName || 'Rakshabandhan Offer',
        }).toString();
        router.push(`/gift-card/success?${query}`);
      } else {
        throw new Error(data.error || 'Failed to process Gift Card.');
      }
    } catch (err: any) {
      console.error('Gift Card Direct Purchase Error:', err);
      toast.error('Redirecting to Gift Card checkout page...', { id: 'rakhi-gc' });
      router.push('/gift-card');
    } finally {
      setIsBuyingGiftCard(false);
    }
  };

  const discountAmount = 500;
  const directOutfitPrice = Math.max(0, product.price - discountAmount);

  return (
    <div className="bg-[#FAF7F2] min-h-screen font-sans text-gray-900 pb-24 md:pb-12">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Top Rakshabandhan Urgent Announcement Bar */}
      <div className="bg-[#3D1515] text-amber-200 py-2.5 px-4 text-xs md:text-sm text-center font-medium border-b border-amber-500/20 flex items-center justify-center gap-2 tracking-wide">
        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
        <span>RAKSHABANDHAN SPECIAL EXCLUSIVE OFFER</span>
        <span className="hidden sm:inline">•</span>
        <span className="text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded text-[11px] uppercase">
          Limited Stock For Festive Season
        </span>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-6 md:pt-10">
        {/* Main Headline */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-[#3D1515] px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold mb-3 border border-amber-200 shadow-sm">
            <Gift className="w-4 h-4 text-[#8C1D11]" />
            <span>Rakshabandhan Double Savings Mega Sale</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#3D1515] leading-tight mb-3">
            Celebrate Rakhi In Luxury Ethnic Elegance
          </h1>
          <p className="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">
            Choose your festival offer below: Get <strong className="text-[#8C1D11]">₹1,000 Gift Voucher for just ₹500</strong> OR enjoy <strong className="text-[#8C1D11]">Instant ₹500 OFF</strong> on our signature Roman Chanderi Silk Anarkali Gown Set!
          </p>

          {/* Countdown Timer Widget */}
          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-white px-4 sm:px-5 py-2.5 rounded-xl border border-amber-200 shadow-sm">
            <Clock className="w-4 h-4 text-[#8C1D11] animate-bounce" />
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">Rakhi Offer Expires (27th Aug):</span>
            <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-[#3D1515]">
              <span className="bg-[#3D1515] text-amber-300 px-2 py-1 rounded">{String(timeLeft.days).padStart(2, '0')}d</span>
              <span>:</span>
              <span className="bg-[#3D1515] text-amber-300 px-2 py-1 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span>:</span>
              <span className="bg-[#3D1515] text-amber-300 px-2 py-1 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span>:</span>
              <span className="bg-[#3D1515] text-amber-300 px-2 py-1 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>
        </div>

        {/* Offer Switcher Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Card 1: Gift Card Offer */}
          <div
            onClick={() => setActiveOfferTab('gift-card')}
            className={`cursor-pointer p-5 md:p-6 rounded-2xl border-2 transition-all relative bg-white shadow-md ${
              activeOfferTab === 'gift-card'
                ? 'border-[#8C1D11] ring-2 ring-[#8C1D11]/20 bg-amber-50/30'
                : 'border-gray-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-[#8C1D11] shrink-0">
                <Gift className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                    OFFER 1: Pay ₹500 → Get ₹1,000 Gift Card
                  </h3>
                  <span className="bg-[#8C1D11] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0">
                    50% Extra Value
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Buy a ₹1,000 Digital Voucher for ₹500 today. Use it on any outfit now or save for future couture shopping!
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xl font-bold text-[#8C1D11]">Pay ₹500</span>
                  <span className="text-xs text-gray-400 line-through">₹1,000 Value</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Save 50%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Direct Product Discount */}
          <div
            onClick={() => setActiveOfferTab('product')}
            className={`cursor-pointer p-5 md:p-6 rounded-2xl border-2 transition-all relative bg-white shadow-md ${
              activeOfferTab === 'product'
                ? 'border-[#8C1D11] ring-2 ring-[#8C1D11]/20 bg-amber-50/30'
                : 'border-gray-200 hover:border-amber-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-[#8C1D11] shrink-0">
                <Tag className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                    OFFER 2: Buy Outfit with Direct ₹500 OFF
                  </h3>
                  <span className="bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0">
                    Instant ₹500 OFF
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Order the featured Roman Chanderi Silk Anarkali Gown Set directly and enjoy automatic ₹500 instant discount.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xl font-bold text-[#8C1D11]">{format(directOutfitPrice)}</span>
                  <span className="text-xs text-gray-400 line-through">{format(product.price)}</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">₹500 Flat Discount</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area based on Active Selection */}
        <div className="bg-white rounded-3xl p-5 md:p-8 border border-amber-200/80 shadow-xl mb-12">
          {activeOfferTab === 'product' ? (
            /* Product Showcase & Purchase View */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Product Media Gallery */}
              <div className="lg:col-span-6 flex flex-col gap-4">
                <div className="relative aspect-[3/4] w-full bg-[#f8f6f0] rounded-2xl overflow-hidden border border-amber-100 group shadow-inner">
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    priority
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute top-3 left-3 bg-[#8C1D11] text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow">
                    Rakhi Special Outfit
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-800 text-[11px] font-semibold px-3 py-1 rounded-full shadow border border-gray-200">
                    🔍 100% Genuine Handwork Silk
                  </div>
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {product.images.map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setActiveImage(img.url)}
                        className={`relative w-20 h-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                          activeImage === img.url ? 'border-[#8C1D11] scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={img.url} alt={img.alt || 'Thumbnail'} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Specifications & Purchase Box */}
              <div className="lg:col-span-6 flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Festive Special Collection
                  </div>
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-[#3D1515] leading-snug">
                    {product.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 text-amber-500 text-xs font-semibold">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-gray-600">(4.9/5 from 186 verified Rakhi buyers)</span>
                  </div>
                </div>

                {/* Pricing Box */}
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200/70">
                  <div className="text-xs font-semibold text-[#8C1D11] uppercase tracking-wider mb-1">
                    Rakshabandhan Exclusive Discounted Price
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-extrabold text-[#3D1515]">{format(directOutfitPrice)}</span>
                    <span className="text-base text-gray-400 line-through">{format(product.price)}</span>
                    <span className="text-xs font-bold bg-[#8C1D11] text-white px-2.5 py-1 rounded">
                      SAVE ₹500 INSTANTLY
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    *Instant ₹500 discount code <code className="font-bold text-[#8C1D11]">RAKHI500</code> is automatically applied to your checkout.
                  </p>
                </div>

                {/* Size Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-2">
                    Select Your Size:
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {['XS (34)', 'S (36)', 'M (38)', 'L (40)', 'XL (42)', 'XXL (44)', 'Custom Size'].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
                          selectedSize === sz
                            ? 'bg-[#3D1515] text-amber-300 border-[#3D1515] shadow'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fabric & Details Bullet List */}
                <div className="border-t border-b border-gray-100 py-3 text-xs text-gray-600 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Top Fabric:</strong> Premium Roman Chanderi Silk with Intricate Handwork Embroidery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Bottom & Inner:</strong> Soft Roman Chanderi Silk Pant with Breathable Lining</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Dupatta:</strong> Designer Matching Chanderi Dupatta with Sequence Lace Work</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><strong>Work Type:</strong> Fine Thread Work, Moti Beads & Metallic Sequence</span>
                  </div>
                </div>

                {/* Call to Action Button */}
                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleBuyProductDirect}
                    className="w-full bg-[#8C1D11] hover:bg-[#6e160d] text-amber-200 font-bold py-4 px-6 rounded-xl text-sm md:text-base flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300 transform active:scale-98"
                  >
                    <ShoppingBag className="w-5 h-5 text-amber-300" />
                    <span>CLAIM ₹500 OFF & BUY OUTFIT NOW</span>
                    <ArrowRight className="w-5 h-5 text-amber-300" />
                  </button>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-1">
                    <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-emerald-600" /> Dispatch Before Rakhi</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Handwork Silk</span>
                    <span className="flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5 text-emerald-600" /> Easy 7-Day Exchange</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Gift Card Instant Claim View */
            <div className="max-w-2xl mx-auto py-4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-amber-100 text-[#8C1D11] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
                  <Gift className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#3D1515]">
                  Claim ₹1,000 Gift Voucher for ₹500
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-2">
                  Pay ₹500 and receive your unique 16-digit <strong>₹1,000 Gift Card Code</strong> instantly via SMS & Email. Redeemable on any outfit at LV's Trendz!
                </p>
              </div>

              <form onSubmit={handleBuyGiftCardDirect} className="space-y-4 bg-amber-50/50 p-6 rounded-2xl border border-amber-200">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Your Name:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8C1D11] focus:border-transparent outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address (To Receive Voucher Code):
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email (e.g. name@gmail.com)"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-[#8C1D11] focus:border-transparent outline-none bg-white"
                  />
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs text-gray-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#8C1D11] shrink-0 mt-0.5" />
                  <span>
                    <strong>Voucher Terms:</strong> Voucher value is ₹1,000. You pay only ₹500 today. Valid for 12 months on all luxury collections. Non-stackable with direct ₹500 outfit coupon.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isBuyingGiftCard}
                  className="w-full bg-[#8C1D11] hover:bg-[#6e160d] text-amber-200 font-bold py-4 px-6 rounded-xl text-sm md:text-base flex items-center justify-center gap-3 shadow-lg transition-all duration-200"
                >
                  <Zap className="w-5 h-5 text-amber-300" />
                  <span>PAY ₹500 & GET ₹1,000 VOUCHER CODE</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Offer Rules Transparency Callout */}
        <div className="bg-amber-100/60 rounded-2xl p-4 md:p-5 border border-amber-300/60 mb-12 text-xs md:text-sm text-gray-800 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#8C1D11] shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-[#3D1515] uppercase tracking-wide">Rakshabandhan Offer Discount Rules:</h4>
            <p className="mt-1 text-gray-700 leading-relaxed">
              • <strong>Direct Outfit Purchase:</strong> If you buy the outfit directly without a gift card, you get instant <strong>₹500 OFF</strong>.<br />
              • <strong>Gift Card Purchase:</strong> If you buy the ₹1,000 Gift Card for ₹500, you get full ₹1,000 voucher value on your purchase.<br />
              • <strong>Exclusivity Rule:</strong> Gift Card redemptions cannot be combined with the direct ₹500 outfit promo code.
            </p>
          </div>
        </div>

        {/* Trust Badges & Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 text-center">
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
            <Truck className="w-6 h-6 text-[#8C1D11] mb-2" />
            <h5 className="font-bold text-xs text-gray-900">Express Delivery</h5>
            <p className="text-[11px] text-gray-500 mt-0.5">Guaranteed Rakhi Dispatch</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
            <ShieldCheck className="w-6 h-6 text-[#8C1D11] mb-2" />
            <h5 className="font-bold text-xs text-gray-900">100% Original Couture</h5>
            <p className="text-[11px] text-gray-500 mt-[#8C1D11]">Premium Chanderi Silk</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
            <Lock className="w-6 h-6 text-[#8C1D11] mb-2" />
            <h5 className="font-bold text-xs text-gray-900">Secure Payments</h5>
            <p className="text-[11px] text-gray-500 mt-0.5">UPI, Cards & Net Banking</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
            <RotateCcw className="w-6 h-6 text-[#8C1D11] mb-2" />
            <h5 className="font-bold text-xs text-gray-900">Easy Exchange</h5>
            <p className="text-[11px] text-gray-500 mt-0.5">Hassle-free Support</p>
          </div>
        </div>

        {/* Customer Reviews & Social Proof */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-amber-200/80 shadow-md">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase text-[#8C1D11] tracking-widest">Verified Customer Feedback</span>
            <h3 className="text-2xl font-serif font-bold text-[#3D1515] mt-1">Loved By Women Across India</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-amber-100 flex flex-col justify-between">
              <p className="text-xs text-gray-700 italic">
                "The Roman Chanderi Silk outfit is absolutely stunning! The handwork embroidery is so delicate and rich. Got the ₹500 discount automatically. Delivered in 3 days!"
              </p>
              <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">— Meera Sharma, Jaipur</span>
                <div className="flex text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /></div>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-amber-100 flex flex-col justify-between">
              <p className="text-xs text-gray-700 italic">
                "I bought the ₹1,000 Gift Card for ₹500 for my sister for Raksha Bandhan. She redeemed it smoothly on her order. Incredible deal!"
              </p>
              <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">— Rohan Verma, Mumbai</span>
                <div className="flex text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /></div>
              </div>
            </div>

            <div className="bg-[#FAF7F2] p-5 rounded-2xl border border-amber-100 flex flex-col justify-between">
              <p className="text-xs text-gray-700 italic">
                "Fabric quality exceeded my expectations! Pure soft silk feel, dupatta embroidery matches perfectly. Ready for Rakhi celebrations!"
              </p>
              <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">— Pooja Patel, Ahmedabad</span>
                <div className="flex text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /><Star className="w-3.5 h-3.5 fill-amber-400" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Festive Product Row Section - Explore More Outfits */}
        {moreProducts && moreProducts.length > 0 && (
          <div className="mt-14">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-amber-700 text-xs font-bold uppercase tracking-widest mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#8C1D11]" /> Exclusive Festive Collection
                </div>
                <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#3D1515]">
                  Explore More Festive Favorites
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1">
                  Discover handcrafted ethnic couture with Rakshabandhan special discounts.
                </p>
              </div>

              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#8C1D11] hover:text-[#6e160d] transition-colors border-b border-[#8C1D11] pb-0.5 self-start md:self-auto"
              >
                <span>VIEW ALL COLLECTIONS</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {moreProducts.map((item) => {
                const itemDiscount =
                  item.compareAtPrice && item.compareAtPrice > item.price
                    ? Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100)
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="group bg-white rounded-2xl border border-amber-100/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Container */}
                      <Link href={`/product/${item.slug}`} className="block relative aspect-[3/4] w-full bg-amber-50/50 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {itemDiscount > 0 && (
                          <div className="absolute top-2.5 left-2.5 bg-[#8C1D11] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                            {itemDiscount}% OFF
                          </div>
                        )}
                      </Link>

                      {/* Product Content */}
                      <div className="p-3.5 md:p-4">
                        {item.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                            {item.category}
                          </span>
                        )}
                        <Link href={`/product/${item.slug}`}>
                          <h4 className="text-xs md:text-sm font-semibold text-gray-900 group-hover:text-[#8C1D11] transition-colors line-clamp-2 leading-snug">
                            {item.name}
                          </h4>
                        </Link>
                      </div>
                    </div>

                    <div className="p-3.5 md:p-4 pt-0">
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-sm md:text-base font-extrabold text-[#3D1515]">
                          {format(item.price)}
                        </span>
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <span className="text-xs text-gray-400 line-through">
                            {format(item.compareAtPrice)}
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/product/${item.slug}`}
                        onClick={() => {
                          const rakhiCoupon = {
                            code: 'RAKHI500',
                            name: 'Rakshabandhan ₹500 Off',
                            type: 'FIXED',
                            value: 500,
                            nonStackable: true,
                          };
                          localStorage.setItem('lvstrendz_coupon', JSON.stringify(rakhiCoupon));
                        }}
                        className="w-full bg-[#FAF7F2] hover:bg-[#3D1515] text-[#3D1515] hover:text-amber-200 border border-amber-200 hover:border-[#3D1515] text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200"
                      >
                        <span>VIEW OUTFIT</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Mobile Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#3D1515] p-3 border-t border-amber-500/30 z-50 md:hidden shadow-2xl flex items-center gap-2">
        <button
          onClick={() => {
            setActiveOfferTab('gift-card');
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
          className="flex-1 bg-amber-200 hover:bg-amber-300 text-[#3D1515] text-xs font-bold py-2.5 px-2 rounded-xl flex flex-col items-center justify-center leading-tight shadow"
        >
          <span>🎁 GET ₹1,000 CARD</span>
          <span className="text-[10px] text-amber-900 font-extrabold">PAY ONLY ₹500</span>
        </button>

        <button
          onClick={handleBuyProductDirect}
          className="flex-1 bg-[#8C1D11] hover:bg-[#a62315] text-amber-200 text-xs font-bold py-2.5 px-2 rounded-xl flex flex-col items-center justify-center leading-tight shadow border border-amber-400/30"
        >
          <span>🛍️ BUY ANARKALI GOWN</span>
          <span className="text-[10px] text-amber-300 font-extrabold">₹500 INSTANT OFF</span>
        </button>
      </div>
    </div>
  );
}
