import { Metadata } from 'next';
import { getProductBySlug } from '@/backend/lib/products';
import { prisma } from '@/backend/lib/db';
import RakhiOfferClient from './RakhiOfferClient';

export const metadata: Metadata = {
  title: "Rakshabandhan Special Offer: Pay ₹500 Get ₹1,000 Gift Card OR ₹500 OFF Anarkali Set | LV's Trendz",
  description:
    "Exclusive Rakshabandhan Offer! Pay ₹500 & get ₹1,000 Gift Card OR get instant ₹500 OFF on our Roman Chanderi Silk Embroidery Anarkali Gown Pant Set with Dupatta. Express delivery before Rakhi!",
  openGraph: {
    title: "Rakshabandhan Offer: Pay ₹500 Get ₹1,000 Gift Card | LV's Trendz",
    description: "Exclusive Rakshabandhan offer on Roman Chanderi Silk Anarkali Gown Set & ₹1,000 Gift Cards for ₹500.",
    images: [
      {
        url: "https://res.cloudinary.com/n5umtsub/image/upload/v1784182822/lvstrendz/products/B4-1784182822219-xx9nqn.webp",
        width: 1200,
        height: 630,
        alt: "Roman Chanderi Silk Embroidery Anarkali Gown Set",
      },
    ],
  },
};

export default async function RakshabandhanOfferPage() {
  const targetSlug = 'roman-chanderi-silk-embroidery-anarkali-gown-pant-set-with-dupatta';

  // Fetch the Roman Chanderi Silk Embroidery Anarkali Gown product & additional products in parallel
  const [product, dbProducts] = await Promise.all([
    getProductBySlug(targetSlug),
    prisma.product
      .findMany({
        where: {
          isActive: true,
          slug: { not: targetSlug },
        },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          categories: { include: { category: true }, take: 1 },
        },
      })
      .catch(() => []),
  ]);

  // Fallback product data if DB entry is not available
  const fallbackProduct = {
    id: 'roman-chanderi-special',
    name: 'Roman Chanderi Silk Embroidery Anarkali Gown Pant Set With Dupatta',
    slug: targetSlug,
    price: 2199,
    compareAtPrice: 3499,
    description: 'Elevate your festive look with our Roman Chanderi Silk Embroidery Anarkali Gown Pant Set. Crafted with rich handwork embroidery, beads details, and paired with a matching designer dupatta.',
    images: [
      { id: '1', url: 'https://res.cloudinary.com/n5umtsub/image/upload/v1784182822/lvstrendz/products/B4-1784182822219-xx9nqn.webp', alt: 'Roman Chanderi Silk Anarkali Gown' },
      { id: '2', url: 'https://res.cloudinary.com/n5umtsub/image/upload/v1784183103/lvstrendz/products/photo_6203974006336065407_y-1784183103348-drz2rw.webp', alt: 'Roman Chanderi Silk Detail' },
    ],
    selectedSizes: [
      { id: 'xs', value: 'XS (34)', slug: 'xs' },
      { id: 's', value: 'S (36)', slug: 's' },
      { id: 'm', value: 'M (38)', slug: 'm' },
      { id: 'l', value: 'L (40)', slug: 'l' },
      { id: 'xl', value: 'XL (42)', slug: 'xl' },
      { id: 'xxl', value: 'XXL (44)', slug: 'xxl' },
    ],
    selectedColors: [
      { id: 'c1', value: 'Maroon / Wine', slug: 'maroon', colorCode: '#5B1B29' },
      { id: 'c2', value: 'Royal Gold', slug: 'gold', colorCode: '#D4AF37' },
    ],
    variants: [],
  };

  const serializedProduct = product
    ? {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : 3499,
        description: product.description,
        images: product.images.map((img) => ({ id: img.id, url: img.url, alt: img.alt })),
        selectedSizes: [
          { id: 'xs', value: 'XS (34)', slug: 'xs' },
          { id: 's', value: 'S (36)', slug: 's' },
          { id: 'm', value: 'M (38)', slug: 'm' },
          { id: 'l', value: 'L (40)', slug: 'l' },
          { id: 'xl', value: 'XL (42)', slug: 'xl' },
          { id: 'xxl', value: 'XXL (44)', slug: 'xxl' },
        ],
        selectedColors: [
          { id: 'c1', value: 'Maroon / Wine', slug: 'maroon', colorCode: '#5B1B29' },
        ],
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          price: v.price ? Number(v.price) : Number(product.price),
          stock: v.stock,
        })),
      }
    : fallbackProduct;

  // Default fallback items for product row
  const defaultMoreProducts = [
    {
      id: 'more-1',
      name: 'Handwork Chanderi Silk Anarkali Suit Set',
      slug: 'handwork-chanderi-silk-anarkali-suit-set',
      price: 2499,
      compareAtPrice: 3999,
      image: 'https://res.cloudinary.com/n5umtsub/image/upload/v1784202406/lvstrendz/products/6-1784202406137-v51zlx.webp',
      category: 'Anarkali Sets',
    },
    {
      id: 'more-2',
      name: 'Royal Maroon Embroidered Velvet Suit',
      slug: 'royal-maroon-embroidered-velvet-suit',
      price: 3499,
      compareAtPrice: 5499,
      image: 'https://res.cloudinary.com/n5umtsub/image/upload/v1784183103/lvstrendz/products/photo_6203974006336065407_y-1784183103348-drz2rw.webp',
      category: 'Festive Couture',
    },
    {
      id: 'more-3',
      name: 'Handcrafted Zari Work Chanderi Gown',
      slug: 'handcrafted-zari-work-chanderi-gown',
      price: 2299,
      compareAtPrice: 3699,
      image: 'https://res.cloudinary.com/n5umtsub/image/upload/v1784182822/lvstrendz/products/B4-1784182822219-xx9nqn.webp',
      category: 'Ethnic Gowns',
    },
    {
      id: 'more-4',
      name: 'Designer Silk Embroidery Sharara Set',
      slug: 'designer-silk-embroidery-sharara-set',
      price: 2799,
      compareAtPrice: 4299,
      image: 'https://res.cloudinary.com/n5umtsub/image/upload/v1784202406/lvstrendz/products/6-1784202406137-v51zlx.webp',
      category: 'Sharara Sets',
    },
  ];

  const moreProducts =
    dbProducts.length > 0
      ? dbProducts.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          image: p.images[0]?.url || defaultMoreProducts[0].image,
          category: p.categories[0]?.category?.name || 'Festive Ethnic Wear',
        }))
      : defaultMoreProducts;

  return <RakhiOfferClient product={serializedProduct} moreProducts={moreProducts} />;
}

