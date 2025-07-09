"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Initialize services schema
export async function initializeServicesSchema() {
  try {
    // Create services table
    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(10,2) NOT NULL,
        duration_minutes INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        device_id INTEGER NOT NULL,
        company_id INTEGER DEFAULT 1,
        created_by INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create service_items table for sales
    await sql`
      CREATE TABLE IF NOT EXISTS service_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price DECIMAL(10,2) NOT NULL,
        notes TEXT,
        staff_id INTEGER,
        service_cost DECIMAL(10,2) DEFAULT 0,
        include_cost_in_invoice BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_services_device_id ON services(device_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active)`
    await sql`CREATE INDEX IF NOT EXISTS idx_services_category ON services(category)`
    await sql`CREATE INDEX IF NOT EXISTS idx_service_items_sale_id ON service_items(sale_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_service_items_service_id ON service_items(service_id)`

    return { success: true, message: "Services schema initialized successfully" }
  } catch (error) {
    console.error("Error initializing services schema:", error)
    return { success: false, message: "Failed to initialize services schema" }
  }
}

// Get all services for a device
export async function getDeviceServices(deviceId: number) {
  try {
    await initializeServicesSchema()

    console.log("Fetching services for device:", deviceId)

    const services = await sql`
      SELECT * FROM services 
      WHERE device_id = ${deviceId} AND is_active = true
      ORDER BY name ASC
    `

    console.log("Found services:", services.length)

    return { success: true, data: services }
  } catch (error) {
    console.error("Error fetching services:", error)
    return { success: false, message: "Failed to fetch services", data: [] }
  }
}

// Add a new service
export async function addService(serviceData: {
  name: string
  price: number
  deviceId: number
  userId: number
}) {
  try {
    await initializeServicesSchema()

    const result = await sql`
      INSERT INTO services (name, price, device_id, created_by)
      VALUES (${serviceData.name}, ${serviceData.price}, ${serviceData.deviceId}, ${serviceData.userId})
      RETURNING *
    `

    revalidatePath("/dashboard")
    return { success: true, data: result[0], message: "Service added successfully" }
  } catch (error) {
    console.error("Error adding service:", error)
    return { success: false, message: "Failed to add service" }
  }
}

// Search services
export async function searchServices(deviceId: number, searchTerm: string) {
  try {
    const searchPattern = `%${searchTerm.toLowerCase()}%`

    const services = await sql`
      SELECT * FROM services 
      WHERE device_id = ${deviceId} 
        AND is_active = true
        AND (
          LOWER(name) LIKE ${searchPattern}
          OR LOWER(description) LIKE ${searchPattern}
          OR LOWER(category) LIKE ${searchPattern}
        )
      ORDER BY name ASC
      LIMIT 20
    `

    return { success: true, data: services }
  } catch (error) {
    console.error("Error searching services:", error)
    return { success: false, message: "Failed to search services", data: [] }
  }
}

// Get service by ID
export async function getServiceById(serviceId: number, deviceId: number) {
  try {
    const result = await sql`
      SELECT * FROM services 
      WHERE id = ${serviceId} AND device_id = ${deviceId} AND is_active = true
    `

    if (result.length === 0) {
      return { success: false, message: "Service not found" }
    }

    return { success: true, data: result[0] }
  } catch (error) {
    console.error("Error fetching service:", error)
    return { success: false, message: "Failed to fetch service" }
  }
}

// Delete service
export async function deleteService(serviceId: number, deviceId: number) {
  try {
    const result = await sql`
      UPDATE services 
      SET is_active = false, updated_at = NOW()
      WHERE id = ${serviceId} AND device_id = ${deviceId}
      RETURNING *
    `

    if (result.length === 0) {
      return { success: false, message: "Service not found" }
    }

    revalidatePath("/dashboard")
    return { success: true, message: "Service deleted successfully" }
  } catch (error) {
    console.error("Error deleting service:", error)
    return { success: false, message: "Failed to delete service" }
  }
}
