
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import ImageUploader from "./components/ImageUploader";
import ImageGrid from "./components/ImageGrid";
import VideoUploader from "./components/VideoUploader";

interface ImagesPageProps {
  params: Promise<{ id: string }>;
}

export default async function ImagesPage({ params }: ImagesPageProps) {
  const { id } = await params;

  const [product, colorAttr] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        videos: {
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          include: {
            attributes: {
              include: {
                attributeValue: {
                  include: { attribute: true },
                },
              },
            },
          },
        },
      },
    }),
    db.attribute.findFirst({
      where: { slug: "color" },
      include: {
        values: { orderBy: { sortOrder: "asc" } },
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  // Check if Cloudinary is configured in .env variables
  const isCloudinaryConfigured = !!(
    process.env.CLOUDINARY_URL ||
    (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET)
  );

  // Format variants for the uploader dropdown
  const variantOptions = product.variants.map((v) => ({
    id: v.id,
    attributes: v.attributes
      .map(
        (a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`
      )
      .join(", ") || "No attributes",
  }));

  // Filter colors to ONLY those selected in attributes or variants for this product
  const variantColorIds = product.variants.flatMap((v) =>
    v.attributes
      .filter((a) => a.attributeValue.attribute.slug === "color")
      .map((a) => a.attributeValueId)
  );

  const keepColorIds = new Set([
    ...(product.selectedColorIds || []),
    ...variantColorIds,
  ]);

  const productColors = colorAttr
    ? colorAttr.values.filter((v) => keepColorIds.has(v.id))
    : [];

  const colorOptions = productColors.map((v) => ({
    id: v.id,
    name: v.value,
    colorCode: v.colorCode,
  }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin/products/${id}`}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Product Media
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
        </div>
      </div>

      {/* Image Uploader */}
      <ImageUploader 
        productId={id} 
        variants={variantOptions} 
        colors={colorOptions}
        isCloudinaryConfigured={isCloudinaryConfigured} 
      />

      {/* Image Grid */}
      <ImageGrid images={product.images} productId={id} variants={variantOptions} colors={colorOptions} />

      {/* Video Uploader */}
      <VideoUploader productId={id} videos={product.videos} />
    </div>
  );
}

