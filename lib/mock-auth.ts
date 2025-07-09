// Mock user data for when the database is unavailable
const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    password_hash: "password_hashed",
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    password_hash: "password_hashed",
  },
  {
    id: 3,
    name: "Admin User",
    email: "admin@example.com",
    password_hash: "password_hashed",
  },
]

// Mock authentication functions
export function mockLogin(email: string, password: string) {
  const user = mockUsers.find((u) => u.email === email)

  if (user && user.password_hash === password + "_hashed") {
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

// Mock dashboard data
export const mockDashboardData = {
  totalSales: 24780.0,
  totalPurchases: 18230.0,
  totalProfit: 6550.0,
  recentSales: [
    {
      id: 1,
      customer_name: "Sarah Johnson",
      sale_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      total_amount: 1499.98,
      status: "Completed",
    },
    {
      id: 2,
      customer_name: "Michael Brown",
      sale_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      total_amount: 349.98,
      status: "Pending",
    },
    {
      id: 3,
      customer_name: "Emily Davis",
      sale_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      total_amount: 89.99,
      status: "Completed",
    },
  ],
  lowStockProducts: [
    { id: 5, name: "Tablet Mini", category: "Electronics", price: 399.99, stock: 3 },
    { id: 6, name: "Smartphone Pro", category: "Electronics", price: 899.99, stock: 5 },
    { id: 3, name: "Smart Watch", category: "Wearables", price: 249.99, stock: 8 },
  ],
  topCustomers: [],
}

// Mock data for other entities
export const mockSales = [
  { id: 1, customer: "Sarah Johnson", date: "2023-05-14", amount: "$1,499.98", status: "Completed" },
  { id: 2, customer: "Michael Brown", date: "2023-05-13", amount: "$349.98", status: "Pending" },
  { id: 3, customer: "Emily Davis", date: "2023-05-12", amount: "$89.99", status: "Completed" },
  { id: 4, customer: "Robert Wilson", date: "2023-05-11", amount: "$1,299.99", status: "Pending" },
  { id: 5, customer: "Jennifer Lee", date: "2023-05-10", amount: "$279.98", status: "Completed" },
]

export const mockPurchases = [
  { id: 1, supplier: "ABC Electronics", date: "2023-05-15", amount: "$6,499.95", status: "Received" },
  { id: 2, supplier: "XYZ Audio", date: "2023-05-14", amount: "$3,999.80", status: "Received" },
  { id: 3, supplier: "Global Tech", date: "2023-05-13", amount: "$2,499.90", status: "Pending" },
  { id: 4, supplier: "Mega Supplies", date: "2023-05-12", amount: "$1,299.90", status: "Received" },
  { id: 5, supplier: "Tech Wholesalers", date: "2023-05-11", amount: "$4,999.95", status: "Cancelled" },
]

export const mockProducts = [
  { id: 1, name: "Laptop Pro X", category: "Electronics", stock: 24, price: "$1,299.00" },
  { id: 2, name: "Wireless Headphones", category: "Audio", stock: 45, price: "$199.00" },
  { id: 3, name: "Smart Watch", category: "Wearables", stock: 8, price: "$249.00" },
  { id: 4, name: "Bluetooth Speaker", category: "Audio", stock: 32, price: "$89.00" },
  { id: 5, name: "Tablet Mini", category: "Electronics", stock: 3, price: "$399.00" },
]

export const mockCustomers = [
  { id: 1, name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1 (555) 234-5678", orders: 12 },
  { id: 2, name: "Michael Brown", email: "michael.b@example.com", phone: "+1 (555) 345-6789", orders: 5 },
  { id: 3, name: "Emily Davis", email: "emily.d@example.com", phone: "+1 (555) 456-7890", orders: 3 },
  { id: 4, name: "Robert Wilson", email: "robert.w@example.com", phone: "+1 (555) 567-8901", orders: 15 },
  { id: 5, name: "Jennifer Lee", email: "jennifer.l@example.com", phone: "+1 (555) 678-9012", orders: 7 },
]
