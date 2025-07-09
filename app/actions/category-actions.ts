"use server"

import { sql, getLastError, resetConnectionState } from "@/lib/db"

export interface Category {
  id: number
  name: string
  description?: string
  created_by?: number
  created_at?: string
  updated_at?: string
}

// Modify the getCategories function to accept a userId parameter and filter by it

// Change this function:
export async function getCategories(userId?: number) {
  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    let categories

    if (userId) {
      // Filter categories by user ID if provided
      categories = await sql`
        SELECT * FROM product_categories
        WHERE created_by = ${userId}
        ORDER BY name ASC
      `

      // If no categories found for this user, return empty array with success
      if (categories.length === 0) {
        console.log(`No categories found for user ID: ${userId}`)
        return { success: true, data: [] }
      }
    } else {
      // Get all categories if no user ID provided
      categories = await sql`
        SELECT * FROM product_categories
        ORDER BY name ASC
      `
    }

    return { success: true, data: categories }
  } catch (error) {
    console.error("Get categories error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: [],
    }
  }
}

// Create a new category
export async function createCategory(formData: FormData | { name: string; description?: string; userId?: number }) {
  let name: string
  let description: string | null = null
  let userId: number | null = null

  // Handle both FormData and direct object input
  if (formData instanceof FormData) {
    name = formData.get("name") as string
    description = (formData.get("description") as string) || null
    userId = formData.get("user_id") ? Number(formData.get("user_id")) : null
  } else {
    name = formData.name
    description = formData.description || null
    userId = formData.userId || null
  }

  if (!name) {
    return { success: false, message: "Category name is required", data: null }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Check if category already exists
    const existingCategory = await sql`
      SELECT * FROM product_categories WHERE name = ${name}
    `

    if (existingCategory.length > 0) {
      return { success: true, message: "Category already exists", data: existingCategory[0] }
    }

    // Create new category
    const result = await sql`
      INSERT INTO product_categories (name, description, created_by)
      VALUES (${name}, ${description}, ${userId})
      RETURNING *
    `

    if (result.length > 0) {
      // Remove revalidatePath to prevent redirection
      return { success: true, message: "Category created successfully", data: result[0] }
    }

    return { success: false, message: "Failed to create category", data: null }
  } catch (error) {
    console.error("Create category error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: null,
    }
  }
}

// Update a category
export async function updateCategory(formData: FormData | { id: number; name: string; description?: string }) {
  let id: number
  let name: string
  let description: string | null = null

  // Handle both FormData and direct object input
  if (formData instanceof FormData) {
    id = Number(formData.get("id"))
    name = formData.get("name") as string
    description = (formData.get("description") as string) || null
  } else {
    id = formData.id
    name = formData.name
    description = formData.description || null
  }

  if (!id || !name) {
    return { success: false, message: "Category ID and name are required", data: null }
  }

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    const result = await sql`
      UPDATE product_categories
      SET name = ${name}, description = ${description}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length > 0) {
      // Remove revalidatePath to prevent redirection
      return { success: true, message: "Category updated successfully", data: result[0] }
    }

    return { success: false, message: "Failed to update category", data: null }
  } catch (error) {
    console.error("Update category error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
      data: null,
    }
  }
}

// Delete a category
export async function deleteCategory(id: number) {
  if (!id) {
    console.error("Delete category error: No ID provided")
    return { success: false, message: "Category ID is required" }
  }

  console.log(`Attempting to delete category with ID: ${id}`)

  // Reset connection state to allow a fresh attempt
  resetConnectionState()

  try {
    // Check if category is used in any products
    console.log("Checking if category is used in products...")
    const products = await sql`SELECT id FROM products WHERE category_id = ${id}`
    console.log(`Found ${products.length} products using this category`)

    if (products.length > 0) {
      console.log("Cannot delete: Category is used by products")
      return {
        success: false,
        message: "Cannot delete category that is used by products. Please reassign products first.",
      }
    }

    console.log("Executing DELETE query...")
    const result = await sql`DELETE FROM product_categories WHERE id = ${id} RETURNING id`
    console.log("Delete query result:", result)

    if (result && result.length > 0) {
      console.log("Category deleted successfully")
      return { success: true, message: "Category deleted successfully" }
    }

    console.log("Delete failed: No rows affected")
    return { success: false, message: "Failed to delete category. Category may not exist." }
  } catch (error) {
    console.error("Delete category database error:", error)
    return {
      success: false,
      message: `Database error: ${getLastError()?.message || "Unknown error"}. Please try again later.`,
    }
  }
}
