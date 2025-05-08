import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Define types for category data
interface CategoryData {
  id: string;
  name: string;
  slug: string;
  path: string;
  level: number;
  parentId: string | null;
  type?: string; // university, level, product-type, etc.
  children?: CategoryData[];
}

// GET endpoint to fetch all categories
export async function GET() {
  try {
    // Fetch all categories
    const categories = await db.category.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        children: true, // Include direct children
      },
    });

    // Transform to a hierarchical structure
    const rootCategories = categories.filter(c => c.parentId === null);
    
    // Build hierarchical structure
    const buildHierarchy = (category: any): CategoryData => {
      const children = categories.filter(c => c.parentId === category.id);
      
      return {
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: category.path,
        level: category.level,
        parentId: category.parentId,
        type: category.description || undefined, // Use description field to store type
        ...(children.length > 0 && { children: children.map(buildHierarchy) }),
      };
    };

    const hierarchicalCategories = rootCategories.map(buildHierarchy);

    return NextResponse.json(hierarchicalCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new category
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, parentId, parentPath, type } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    
    // Determine path and level
    let path = slug;
    let level = 1;

    if (parentId) {
      const parent = await db.category.findUnique({
        where: { id: parentId },
      });
      
      if (!parent) {
        return NextResponse.json(
          { error: "Parent category not found" },
          { status: 404 }
        );
      }
      
      path = `${parent.path}/${slug}`;
      level = parent.level + 1;
    } else if (parentPath) {
      // If parentPath is provided but not parentId (for UI convenience)
      path = `${parentPath}/${slug}`;
      level = (parentPath.match(/\//g) || []).length + 2; // Count slashes + 2
    }

    // Create the new category
    const newCategory = await db.category.create({
      data: {
        name,
        slug,
        path,
        level,
        parentId,
        description: type || undefined, // Store category type in description field
      },
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error("Error creating category:", error);
    
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a category
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    // Check if this category has children
    const childrenCount = await db.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category with subcategories" },
        { status: 400 }
      );
    }

    // Check if this category is used in any products
    const productsCount = await db.categoryProduct.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a category that is assigned to products" },
        { status: 400 }
      );
    }

    // Delete the category
    await db.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
