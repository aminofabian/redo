"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string | null;
}

export async function createCategory(data: CreateCategoryInput) {
  try {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Calculate level based on parent
    let level = 1;
    let path = slug;
    
    if (data.parentId) {
      const parent = await db.category.findUnique({
        where: { id: data.parentId }
      });
      
      if (parent) {
        level = parent.level + 1;
        path = `${parent.path}/${slug}`;
      }
    }
    
    // Create the category
    const category = await db.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId || null,
        level,
        path,
        isActive: true
      }
    });
    
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    
    return { success: true, category };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, error: "Failed to create category" };
  }
}

export async function updateCategory(id: string, data: {
  name?: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
}) {
  try {
    // If name is changing, update slug
    let updateData: any = { ...data };
    
    if (data.name) {
      updateData.slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // If parent is changing, update level and path
    if ('parentId' in data) {
      let level = 1;
      let path = updateData.slug || (await db.category.findUnique({ where: { id } }))?.slug || '';
      
      if (data.parentId) {
        const parent = await db.category.findUnique({
          where: { id: data.parentId }
        });
        
        if (parent) {
          level = parent.level + 1;
          path = `${parent.path}/${path}`;
        }
      }
      
      updateData.level = level;
      updateData.path = path;
      
      // This will need to update all children paths as well - complex operation
      await updateChildrenPaths(id);
    }
    
    // Update the category
    const category = await db.category.update({
      where: { id },
      data: updateData
    });
    
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    
    return { success: true, category };
  } catch (error) {
    console.error("Failed to update category:", error);
    return { success: false, error: "Failed to update category" };
  }
}

// Helper to update all children paths recursively when a parent's path changes
async function updateChildrenPaths(categoryId: string) {
  const children = await db.category.findMany({
    where: { parentId: categoryId }
  });
  
  const parent = await db.category.findUnique({
    where: { id: categoryId }
  });
  
  if (!parent) return;
  
  for (const child of children) {
    // Update this child's path based on parent
    const updatedPath = `${parent.path}/${child.slug}`;
    await db.category.update({
      where: { id: child.id },
      data: { 
        path: updatedPath,
        level: parent.level + 1
      }
    });
    
    // Recursively update this child's children
    await updateChildrenPaths(child.id);
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if category has children
    const childrenCount = await db.category.count({
      where: { parentId: id }
    });
    
    if (childrenCount > 0) {
      return { 
        success: false, 
        error: "Cannot delete category with subcategories. Please delete subcategories first."
      };
    }
    
    // Check if category has products
    const productsCount = await db.categoryProduct.count({
      where: { categoryId: id }
    });
    
    if (productsCount > 0) {
      return { 
        success: false, 
        error: "Cannot delete category with associated products. Please remove products first or deactivate the category instead."
      };
    }
    
    // Delete the category
    await db.category.delete({
      where: { id }
    });
    
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Failed to delete category" };
  }
} 