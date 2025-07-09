// Utility functions for exporting data

// Function to convert data to CSV format
export function convertToCSV(data: any[], headers: string[]) {
  // Create header row
  let csv = headers.join(",") + "\n"

  // Add data rows
  data.forEach((item) => {
    const row = headers.map((header) => {
      // Get the value for this header
      const value = item[header.toLowerCase().replace(/\s+/g, "_")] || ""

      // If the value contains commas, quotes, or newlines, wrap it in quotes
      if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    })

    csv += row.join(",") + "\n"
  })

  return csv
}

// Function to download data as a file
export function downloadFile(data: string, filename: string, type: string) {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

// Function to export transactions as CSV
export function exportTransactionsAsCSV(transactions: any[], filename = "financial_transactions.csv") {
  const headers = ["Date", "Type", "Category", "Description", "Amount"]

  // Map transactions to the format needed for CSV
  const formattedData = transactions.map((t) => ({
    date: t.transaction_date ? new Date(t.transaction_date).toLocaleDateString() : "",
    type: t.transaction_type === "income" ? "Income" : "Expense",
    category: t.category_name || t.transaction_name || "General",
    description: t.description || "",
    amount: t.amount || 0,
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadFile(csv, filename, "text/csv;charset=utf-8;")
}

// Function to export transactions as Excel (simplified - in a real app, would use a library like xlsx)
export function exportTransactionsAsExcel(transactions: any[], filename = "financial_transactions.xlsx") {
  // For simplicity, we'll just use CSV with an .xlsx extension
  // In a real app, you would use a library like xlsx to create a proper Excel file
  exportTransactionsAsCSV(transactions, filename)
}

// Function to generate a simple PDF (simplified - in a real app, would use a library like jsPDF)
export function exportTransactionsAsPDF(transactions: any[], filename = "financial_transactions.pdf") {
  // This is a placeholder - in a real app, you would use a library like jsPDF
  alert("PDF export would be implemented with a library like jsPDF in a production app")

  // For now, fall back to CSV
  exportTransactionsAsCSV(transactions, filename.replace(".pdf", ".csv"))
}

// Function to export products as CSV
export function exportProductsAsCSV(products: any[], filename = "products.csv") {
  const headers = ["ID", "Name", "Category", "Barcode", "Price", "Wholesale Price", "Stock", "Description"]

  // Map products to the format needed for CSV
  const formattedData = products.map((p) => ({
    id: p.id || "",
    name: p.name || "",
    category: p.category || "",
    barcode: p.barcode || "",
    price: p.price || 0,
    wholesale_price: p.wholesale_price || 0,
    stock: p.stock || 0,
    description: p.description || "",
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadFile(csv, filename, "text/csv;charset=utf-8;")
}

// Function to export sales as CSV
export function exportSalesAsCSV(sales: any[], filename = "sales.csv") {
  const headers = ["ID", "Date", "Customer", "Phone", "Total Amount", "Discount", "Payment Method", "Status"]

  // Map sales to the format needed for CSV
  const formattedData = sales.map((s) => ({
    id: s.id || "",
    date: s.sale_date ? new Date(s.sale_date).toLocaleDateString() : "",
    customer: s.customer_name || "Walk-in Customer",
    phone: s.customer_phone || "",
    total_amount: s.total_amount || 0,
    discount: s.discount || 0,
    payment_method: s.payment_method || "Cash",
    status: s.status || "",
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadFile(csv, filename, "text/csv;charset=utf-8;")
}

// Function to export purchases as CSV
export function exportPurchasesAsCSV(purchases: any[], filename = "purchases.csv") {
  const headers = ["ID", "Date", "Supplier", "Total Amount", "Payment Status", "Payment Method", "Delivery Status"]

  // Map purchases to the format needed for CSV
  const formattedData = purchases.map((p) => ({
    id: p.id || "",
    date: p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : "",
    supplier: p.supplier || "",
    total_amount: p.total_amount || 0,
    payment_status: p.status || "",
    payment_method: p.payment_method || "",
    delivery_status: p.purchase_status || "Delivered",
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadFile(csv, filename, "text/csv;charset=utf-8;")
}

// Function to export customers as CSV
export function exportCustomersAsCSV(customers: any[], filename = "customers.csv") {
  const headers = ["ID", "Name", "Phone", "Email", "Address", "Order Count"]

  // Map customers to the format needed for CSV
  const formattedData = customers.map((c) => ({
    id: c.id || "",
    name: c.name || "",
    phone: c.phone || "",
    email: c.email || "",
    address: c.address || "",
    order_count: c.order_count || 0,
  }))

  const csv = convertToCSV(formattedData, headers)
  downloadFile(csv, filename, "text/csv;charset=utf-8;")
}

// Function to export stock data as CSV
export function exportStockAsCSV(products: any[], filename = "stock_report.csv") {
  const headers = ["ID", "Product Name", "Category", "Barcode", "Stock", "Status", "Retail Price", "Wholesale Price"]

  // Map products to the format needed for CSV
  const formattedData = products.map((p) => {
    const stock = Number(p.stock) || 0
    let status = "In Stock"
    if (stock <= 0) {
      status = "Out of Stock"
    } else if (stock <= 5) {
      status = "Low Stock"
    }

    return {
      id: p.id || "",
      name: p.name || "",
      category: p.category || "",
      barcode: p.barcode || "",
      stock: stock,
      status: status,
      price: p.price || 0,
      wholesale_price: p.wholesale_price || 0,
    }
  })

  const csv = convertToCSV(formattedData, headers)
  downloadFile(csv, filename, "text/csv;charset=utf-8;")
}

// Function to export detailed sale data with items as CSV
export function exportDetailedSaleAsCSV(sale: any, items: any[], filename = `sale_${sale.id}_detailed.csv`) {
  // First, create the sale header information
  let csv = "SALE INFORMATION\n"
  csv += `Sale ID,${sale.id}\n`
  csv += `Date,${new Date(sale.sale_date).toLocaleDateString()}\n`
  csv += `Customer,${sale.customer_name || "Walk-in Customer"}\n`
  csv += `Phone,${sale.customer_phone || ""}\n`
  csv += `Payment Method,${sale.payment_method || "Cash"}\n`
  csv += `Status,${sale.status || ""}\n`
  csv += `Subtotal,${Number(sale.total_amount) + Number(sale.discount || 0)}\n`
  csv += `Discount,${sale.discount || 0}\n`
  csv += `Total Amount,${sale.total_amount || 0}\n\n`

  // Then, add the items table
  csv += "SALE ITEMS\n"
  csv += "Product ID,Product Name,Barcode,Unit Price,Quantity,Total\n"

  items.forEach((item) => {
    const total = Number(item.price) * Number(item.quantity)
    csv += `${item.product_id || ""},${item.product_name || ""},${item.barcode || ""},${item.price || 0},${
      item.quantity || 0
    },${total}\n`
  })

  downloadFile(csv, filename, "text/csv;charset=utf-8;")
}

// Function to export detailed purchase data with items as CSV
export function exportDetailedPurchaseAsCSV(
  purchase: any,
  items: any[],
  filename = `purchase_${purchase.id}_detailed.csv`,
) {
  // First, create the purchase header information
  let csv = "PURCHASE INFORMATION\n"
  csv += `Purchase ID,${purchase.id}\n`
  csv += `Date,${new Date(purchase.purchase_date).toLocaleDateString()}\n`
  csv += `Supplier,${purchase.supplier || ""}\n`
  csv += `Payment Status,${purchase.status || ""}\n`
  csv += `Payment Method,${purchase.payment_method || ""}\n`
  csv += `Delivery Status,${purchase.purchase_status || "Delivered"}\n`
  csv += `Total Amount,${purchase.total_amount || 0}\n\n`

  // Then, add the items table
  csv += "PURCHASE ITEMS\n"
  csv += "Product ID,Product Name,Unit Price,Quantity,Total\n"

  items.forEach((item) => {
    const total = Number(item.price) * Number(item.quantity)
    csv += `${item.product_id || ""},${item.product_name || ""},${item.price || 0},${item.quantity || 0},${total}\n`
  })

  downloadFile(csv, filename, "text/csv;charset=utf-8;")
}
