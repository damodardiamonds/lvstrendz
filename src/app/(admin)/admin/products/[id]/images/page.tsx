
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

  const product = await db.product.findUnique({
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
  });

  if (!product) {
    notFound();
  }

  // Format variants for the uploader dropdown
  const variantOptions = product.variants.map((v) => ({
    id: v.id,
    attributes: v.attributes
      .map(
        (a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`
      )
      .join(", ") || "No attributes",
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
      <ImageUploader productId={id} variants={variantOptions} />

      {/* Image Grid */}
      <ImageGrid images={product.images} productId={id} />

      {/* Video Uploader */}
      <VideoUploader productId={id} videos={product.videos} />
    </div>
  );
}

