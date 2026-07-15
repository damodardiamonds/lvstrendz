import React from "react";
import { db } from "@/lib/db";
import CheckoutClient from "./CheckoutClient";

export const revalidate = 0; // Don't cache checkout page

export default async function CheckoutPage() {
  // 1. Fetch active categories and compute their product count
  const categoriesData = await db.category.findMany({
    where: { isActive: true },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  const categories = categoriesData.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    count: c.products.filter((p) => p.product.isActive).length,
  }));

  // 2. Fetch Colors attribute values
  const colorAttr = await db.attribute.findFirst({
    where: {
      slug: {
        equals: "color",
        mode: "insensitive",
      },
    },
    include: {
      values: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const colors = colorAttr
    ? colorAttr.values.map((v) => ({
        name: v.value,
        slug: v.slug,
        colorCode: v.colorCode || "#cccccc",
      }))
    : [];

  // 3. Fetch Sizes attribute values
  const sizeAttr = await db.attribute.findFirst({
    where: {
      slug: {
        equals: "size",
        mode: "insensitive",
      },
    },
    include: {
      values: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const sizes = sizeAttr
    ? sizeAttr.values.map((v) => ({
        name: v.value,
        slug: v.slug,
      }))
    : [];

  // 4. Fetch Top Rated Products
  const productsWithReviews = await db.product.findMany({
    where: { isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      reviews: { where: { isApproved: true } },
    },
  });

  const ratedProducts = productsWithReviews.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
        : 0;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      originalPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      image: p.images[0]?.url || "/images/placeholder.jpg",
      rating: avgRating,
      reviewsCount: ratings.length,
    };
  });

  const hasRatings = ratedProducts.some((p) => p.rating > 0);
  let topRatedProducts = [];

  if (hasRatings) {
    topRatedProducts = ratedProducts
      .sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount)
      .slice(0, 8);
  } else {
    // Fallback to featured / elite products if no ratings exist yet
    const featured = await db.product.findMany({
      where: { isActive: true },
      orderBy: { isFeatured: "desc" },
      take: 8,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    });

    topRatedProducts = featured.map((p) => {
      const price = Number(p.price);
      const originalPrice = p.compareAtPrice ? Number(p.compareAtPrice) : null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price,
        originalPrice,
        image: p.images[0]?.url || "/images/placeholder.jpg",
        rating: 5, // fallback rating
        reviewsCount: 1, // fallback count
      };
    });
  }

  return (
    <CheckoutClient
      categories={categories}
      colors={colors}
      sizes={sizes}
      topRatedProducts={topRatedProducts}
    />
  );
}
