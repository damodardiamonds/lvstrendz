"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const parentId = formData.get("parentId") as string;
  const isActive = formData.get("isActive") === "true";

  await db.category.create({
    data: {
      name,
      slug: slug.trim().toLowerCase(),
      description: description || null,
      parentId: parentId || null,
      isActive,
    },
  });

  revalidatePath("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;
  const description = formData.get("description") as string;
  const parentId = formData.get("parentId") as string;
  const isActive = formData.get("isActive") === "true";

  // Prevent circular parent dependency
  if (parentId === id) {
    throw new Error("A category cannot be its own parent.");
  }

  await db.category.update({
    where: { id },
    data: {
      name,
      slug: slug.trim().toLowerCase(),
      description: description || null,
      parentId: parentId || null,
      isActive,
    },
  });

  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await db.category.delete({
    where: { id },
  });

  revalidatePath("/admin/categories");
}

export async function toggleCategoryStatus(id: string, isActive: boolean) {
  await db.category.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/categories");
}
