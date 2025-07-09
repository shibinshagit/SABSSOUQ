// Mock user data
export const mockUsers = [
  {
    id: 1,
    name: "Demo User",
    email: "demo@example.com",
    password_hash: "password_hashed",
    auth_token: "demo_token",
  },
  {
    id: 2,
    name: "John Doe",
    email: "john@example.com",
    password_hash: "password_hashed",
    auth_token: "john_token",
  },
  {
    id: 3,
    name: "Jane Smith",
    email: "jane@example.com",
    password_hash: "password_hashed",
    auth_token: "jane_token",
  },
]

// Mock sales data
export const mockSales = [
  {
    id: 1,
    customer_id: 1,
    customer_name: "Sarah Johnson",
    total_amount: 1499.98,
    status: "Completed",
    sale_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
  {
    id: 2,
    customer_id: 2,
    customer_name: "Michael Brown",
    total_amount: 349.98,
    status: "Pending",
    sale_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
  {
    id: 3,
    customer_id: 3,
    customer_name: "Emily Davis",
    total_amount: 89.99,
    status: "Completed",
    sale_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
  {
    id: 4,
    customer_id: 4,
    customer_name: "Robert Wilson",
    total_amount: 1299.99,
    status: "Pending",
    sale_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
  {
    id: 5,
    customer_id: 5,
    customer_name: "Jennifer Lee",
    total_amount: 279.98,
    status: "Completed",
    sale_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
]

// Mock purchases data
export const mockPurchases = [
  {
    id: 1,
    supplier: "ABC Electronics",
    total_amount: 6499.95,
    status: "Received",
    purchase_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
  {
    id: 2,
    supplier: "XYZ Audio",
    total_amount: 3999.8,
    status: "Received",
    purchase_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
  {
    id: 3,
    supplier: "Global Tech",
    total_amount: 2499.9,
    status: "Pending",
    purchase_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
  {
    id: 4,
    supplier: "Mega Supplies",
    total_amount: 1299.9,
    status: "Received",
    purchase_date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
  {
    id: 5,
    supplier: "Tech Wholesalers",
    total_amount: 4999.95,
    status: "Cancelled",
    purchase_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    created_by: 1,
  },
]

// Mock products data
export const mockProducts = [
  {
    id: 1,
    name: "Laptop Pro X",
    category: "Electronics",
    description: "High-performance laptop with 16GB RAM and 512GB SSD",
    price: 1299.0,
    stock: 24,
    created_by: 1,
  },
  {
    id: 2,
    name: "Wireless Headphones",
    category: "Audio",
    description: "Noise-cancelling wireless headphones with 30-hour battery life",
    price: 199.0,
    stock: 45,
    created_by: 1,
  },
  {
    id: 3,
    name: "Smart Watch",
    category: "Wearables",
    description: "Fitness tracker with heart rate monitor and GPS",
    price: 249.0,
    stock: 8,
    created_by: 1,
  },
  {
    id: 4,
    name: "Bluetooth Speaker",
    category: "Audio",
    description: "Portable waterproof speaker with 20-hour battery life",
    price: 89.0,
    stock: 32,
    created_by: 1,
  },
  {
    id: 5,
    name: "Tablet Mini",
    category: "Electronics",
    description: "8-inch tablet with 64GB storage and 10-hour battery life",
    price: 399.0,
    stock: 3,
    created_by: 1,
  },
]

// Mock customers data
export const mockCustomers = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    phone: "+1 (555) 234-5678",
    address: "123 Main St, Anytown, USA",
    created_by: 1,
  },
  {
    id: 2,
    name: "Michael Brown",
    email: "michael.b@example.com",
    phone: "+1 (555) 345-6789",
    address: "456 Oak Ave, Somewhere, USA",
    created_by: 1,
  },
  {
    id: 3,
    name: "Emily Davis",
    email: "emily.d@example.com",
    phone: "+1 (555) 456-7890",
    address: "789 Pine Rd, Nowhere, USA",
    created_by: 1,
  },
  {
    id: 4,
    name: "Robert Wilson",
    email: "robert.w@example.com",
    phone: "+1 (555) 567-8901",
    address: "321 Elm St, Everywhere, USA",
    created_by: 1,
  },
  {
    id: 5,
    name: "Jennifer Lee",
    email: "jennifer.l@example.com",
    phone: "+1 (555) 678-9012",
    address: "654 Maple Dr, Anywhere, USA",
    created_by: 1,
  },
]

// Mock authentication functions
export function mockLogin(email: string, password: string) {
  const user = mockUsers.find((u) => u.email === email)

  if (user && (password === "password" || user.password_hash === password + "_hashed")) {
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  return null
}

export function mockGetUserById(id: number) {
  const user = mockUsers.find((u) => u.id === id)

  if (user) {
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  return null
}

export function mockGetUserByToken(token: string) {
  const user = mockUsers.find((u) => u.auth_token === token)

  if (user) {
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  return null
}

// Mock dashboard data
export function getMockDashboardData(userId: number) {
  // Filter sales and purchases by user ID
  const userSales = mockSales.filter((sale) => sale.created_by === userId)
  const userPurchases = mockPurchases.filter((purchase) => purchase.created_by === userId)

  // Calculate totals
  const totalSales = userSales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalPurchases = userPurchases.reduce((sum, purchase) => sum + purchase.total_amount, 0)
  const totalProfit = totalSales - totalPurchases

  // Get recent sales
  const recentSales = [...userSales]
    .sort((a, b) => new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime())
    .slice(0, 5)

  // Get low stock products
  const lowStockProducts = mockProducts
    .filter((product) => product.stock <= 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  return {
    totalSales,
    totalPurchases,
    totalProfit,
    recentSales,
    lowStockProducts,
    topCustomers: [],
  }
}

// Get user sales
export function getMockUserSales(userId: number) {
  return mockSales.filter((sale) => sale.created_by === userId)
}

// Get user purchases
export function getMockUserPurchases(userId: number) {
  return mockPurchases.filter((purchase) => purchase.created_by === userId)
}

// Get user products
export function getMockUserProducts(userId: number) {
  return mockProducts.filter((product) => product.created_by === userId)
}

// Get user customers
export function getMockUserCustomers(userId: number) {
  return mockCustomers.filter((customer) => customer.created_by === userId)
}
