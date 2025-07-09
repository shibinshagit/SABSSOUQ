"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { printSalesReceipt } from "@/lib/receipt-utils"
import { Printer } from "lucide-react"
import { useState } from "react"

export default function TestReceiptPage() {
  const [isPrinting, setIsPrinting] = useState(false)

  // Sample sale data
  const mockSale = {
    id: "TEST-1001",
    sale_date: new Date().toISOString(),
    total_amount: 456.75,
    payment_amount: 500,
    customer_name: "Test Customer",
  }

  // Sample line items with different lengths and prices
  const mockItems = [
    {
      product_name: "Men's T-Shirt Large Size Blue Cotton",
      barcode: "8901234567890",
      quantity: 2,
      price: 45.5,
      original_price: 45.5,
    },
    {
      product_name: "Women's Dress Medium",
      barcode: "8901234567891",
      quantity: 1,
      price: 120.75,
      original_price: 149.99, // Price changed item
    },
    {
      product_name: "Kids Shoes Size 5",
      barcode: "8901234567892",
      quantity: 1,
      price: 65.0,
      original_price: 65.0,
    },
    {
      product_name: "Leather Belt Brown",
      barcode: "8901234567893",
      quantity: 1,
      price: 35.0,
      original_price: 35.0,
    },
    {
      product_name: "Socks Pack of 3",
      barcode: "8901234567894",
      quantity: 2,
      price: 25.0,
      original_price: 30.0, // Price changed item
    },
    {
      product_name: "Winter Jacket XL Black",
      barcode: "8901234567895",
      quantity: 1,
      price: 95.0,
      original_price: 95.0,
    },
  ]

  const printTestReceipt = () => {
    setIsPrinting(true)

    // Print the receipt
    printSalesReceipt(mockSale, mockItems, {
      name: "AL ANEEQ DRESS NOVALITY",
      address: "MESAIEED CITY, INSIDE DUNES MALL COMPLEX, DOHA, QATAR",
      phone: "+974 66972156",
    })

    // Reset printing state after a delay
    setTimeout(() => {
      setIsPrinting(false)
    }, 2000)
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Test Receipt Printing</CardTitle>
          <CardDescription>Print a test receipt to verify column alignment and formatting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Sample Receipt Details:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Invoice #: TEST-1001</li>
              <li>Date: {new Date().toLocaleDateString()}</li>
              <li>Time: {new Date().toLocaleTimeString()}</li>
              <li>Total Amount: QAR 456.75</li>
              <li>Items: 6 different products (8 total items)</li>
              <li>2 items with price changes</li>
            </ul>
          </div>

          <Button onClick={printTestReceipt} className="w-full" disabled={isPrinting}>
            {isPrinting ? (
              <>
                <Printer className="mr-2 h-4 w-4 animate-spin" />
                Printing...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print Test Receipt
              </>
            )}
          </Button>

          <div className="text-sm text-gray-500 text-center">
            Make sure pop-ups are allowed in your browser to see the receipt
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
