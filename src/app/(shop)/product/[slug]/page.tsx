// src/app/(shop)/product/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/products';
import ProductDetailsClient from './ProductDetailsClient';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: 'Product Not Found - LV\'s Trendz',
      description: 'The requested product could not be found.',
    };
  }

  // Strip HTML tags for clean description
  const cleanDescription = product.shortDescription
    ? product.shortDescription.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Buy ${product.name} online at LV's Trendz. Premium Indian ethnic wear.`;

  return {
    title: `${product.name} — LV's Trendz`,
    description: cleanDescription,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Serialize Prisma Decimal objects to prevent Next.js Client Component boundary serialization errors
  const serializedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    sku: product.sku,
    price: product.price.toString(),
    compareAtPrice: product.compareAtPrice ? product.compareAtPrice.toString() : null,
    images: product.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
    })),
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      price: variant.price ? variant.price.toString() : null,
      stock: variant.stock,
      isActive: variant.isActive,
      images: variant.images.map((vImg) => ({
        id: vImg.id,
        url: vImg.url,
        alt: vImg.alt,
      })),
      attributes: variant.attributes.map((vAttr) => ({
        attributeValue: {
          id: vAttr.attributeValue.id,
          value: vAttr.attributeValue.value,
          slug: vAttr.attributeValue.slug,
          colorCode: vAttr.attributeValue.colorCode,
          attribute: {
            name: vAttr.attributeValue.attribute.name,
            slug: vAttr.attributeValue.attribute.slug,
          },
        },
      })),
    })),
  };

  return <ProductDetailsClient product={serializedProduct} />;
}
