import { Metadata } from 'next';
import { getProductBySlug } from '@/backend/lib/products';
import RakhiOfferClient from './RakhiOfferClient';

export const metadata: Metadata = {
  title: "Rakshabandhan Special Offer: Pay ₹500 Get ₹1,000 Gift Card OR ₹500 OFF Anarkali Set | LV's Trendz",
  description:
    "Exclusive Rakshabandhan Meta Ads Offer! Pay ₹500 & get ₹1,000 Gift Card OR get instant ₹500 OFF on our Roman Chanderi Silk Embroidery Anarkali Gown Pant Set with Dupatta. Express delivery before Rakhi!",
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
  // Fetch the Roman Chanderi Silk Embroidery Anarkali Gown product
  const product = await getProductBySlug('roman-chanderi-silk-embroidery-anarkali-gown-pant-set-with-dupatta');

  // Fallback product data if DB entry is not available
  const fallbackProduct = {
    id: 'roman-chanderi-special',
    name: 'Roman Chanderi Silk Embroidery Anarkali Gown Pant Set With Dupatta',
    slug: 'roman-chanderi-silk-embroidery-anarkali-gown-pant-set-with-dupatta',
    price: 2199,
    compareAtPrice: 3499,
    description: 'Elevate your festive look with our Roman Chanderi Silk Embroidery Anarkali Gown Pant Set. Crafted with rich handwork embroidery, beads details, and paired with a matching designer dupatta.',
    images: [
      { id: '1', url: 'https://res.cloudinary.com/n5umtsub/image/upload/v1784182822/lvstrendz/products/B4-1784182822219-xx9nqn.webp', alt: 'Roman Chanderi Silk Anarkali Gown' },
      { id: '2', url: 'https://res.cloudinary.com/n5umtsub/image/upload/v1784183103/lvstrendz/products/photo_6203974006336065407_y-1784183103348-drz2rw.webp', alt: 'Roman Chanderi Silk Detail' },
    ],
    selectedSizes: [
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

  return <RakhiOfferClient product={serializedProduct} />;
}
