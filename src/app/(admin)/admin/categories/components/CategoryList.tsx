"use client";

import { useEffect, useState, useTransition } from "react";
import { Edit, Trash2, Eye, EyeOff, Folder, Plus, Loader2, X } from "lucide-react";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
} from "../actions";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  parent?: { name: string } | null;
}

interface CategoryListProps {
  categories: Category[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [autoSlug, setAutoSlug] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Auto-generate slug from name
  useEffect(() => {
    if (autoSlug && name && !editingCategory) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  }, [name, autoSlug, editingCategory]);

  // Set form fields when editing a category
  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setSlug(editingCategory.slug);
      setDescription(editingCategory.description || "");
      setParentId(editingCategory.parentId || "");
      setIsActive(editingCategory.isActive);
      setAutoSlug(false);
    } else {
      resetForm();
    }
  }, [editingCategory]);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setParentId("");
    setIsActive(true);
    setAutoSlug(true);
    setEditingCategory(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("description", description);
      formData.append("parentId", parentId);
      formData.append("isActive", String(isActive));

      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || "An error occurred while saving the category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      await deleteCategory(id);
      if (editingCategory?.id === id) {
        resetForm();
      }
    } catch (err: any) {
      alert(err.message || "An error occurred while deleting the category.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleToggleStatus = (cat: Category) => {
    startTransition(async () => {
      try {
        await toggleCategoryStatus(cat.id, !cat.isActive);
        if (editingCategory?.id === cat.id) {
          setIsActive(!cat.isActive);
        }
      } catch (err: any) {
        alert(err.message || "An error occurred while updating status.");
      }
    });
  };

  // Filter out the category being edited from parent options to avoid circular reference
  const parentOptions = categories.filter(
    (c) => !editingCategory || c.id !== editingCategory.id
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Category List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 font-medium text-gray-600">Category</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600">Slug</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600">Parent</th>
                  <th className="text-left px-6 py-4 font-medium text-gray-600">Status</th>
                  <th className="text-right px-6 py-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                      <Folder className="mx-auto text-gray-300 mb-2" size={32} />
                      No categories found. Create one on the right!
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      {/* Name & Description */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{cat.name}</div>
                        {cat.description && (
                          <div className="text-xs text-gray-500 line-clamp-1 max-w-xs">
                            {cat.description}
                          </div>
                        )}
                      </td>

                      {/* Slug */}
                      <td className="px-6 py-4 text-gray-600">{cat.slug}</td>

                      {/* Parent */}
                      <td className="px-6 py-4 text-gray-500">
                        {cat.parent?.name || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(cat)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                            cat.isActive
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {cat.isActive ? (
                            <>
                              <Eye size={12} /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff size={12} /> Draft
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setEditingCategory(cat)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#A0463E] hover:bg-gray-100 transition-all"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id, cat.name)}
                            disabled={isDeletingId === cat.id}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeletingId === cat.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Form Card */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm sticky top-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingCategory ? "Edit Category" : "Add New Category"}
            </h2>
            {editingCategory && (
              <button
                onClick={resetForm}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title="Cancel Edit"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Sarees, Lehengas"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Slug <span className="text-red-500">*</span>
                </label>
                {!editingCategory && !autoSlug && (
                  <button
                    type="button"
                    onClick={() => setAutoSlug(true)}
                    className="text-[10px] text-[#A0463E] font-medium hover:underline"
                  >
                    Auto-generate
                  </button>
                )}
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setAutoSlug(false);
                }}
                required
                placeholder="e.g. sarees"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition"
              />
            </div>

            {/* Parent Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Parent Category (Optional)
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none bg-white transition cursor-pointer"
              >
                <option value="">None</option>
                {parentOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Brief description of products in this category..."
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#A0463E] focus:border-transparent outline-none transition resize-y"
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#A0463E] focus:ring-[#A0463E] cursor-pointer"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer select-none">
                Active (Show on store)
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#A0463E] text-white text-sm font-semibold rounded-lg hover:bg-[#8a3b34] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : editingCategory ? (
                "Update Category"
              ) : (
                <>
                  <Plus size={16} /> Create Category
                </>
              )}
            </button>

            {editingCategory && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
