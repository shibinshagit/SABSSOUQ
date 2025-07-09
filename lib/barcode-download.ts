"use client"

import JsBarcode from "jsbarcode"
import { toArabicNumerals } from "./barcode-utils"

// Function to download barcode as PDF or PNG
export function downloadBarcode(product: any, format: "png" | "pdf" = "png") {
  // Check if we're in a browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    console.warn("Cannot download barcode: Not in browser environment")
    return
  }

  // Create canvas element for barcode
  const canvas = document.createElement("canvas")
  const barcodeValue = product.barcode || `200${product.id.toString().padStart(9, "0")}0`
  const itemCode = product.id.toString().padStart(4, "0")
  const priceInQAR = Number(product.price).toFixed(2)
  const priceInArabic = toArabicNumerals(Number(product.price))

  // Generate barcode on canvas
  JsBarcode(canvas, barcodeValue, {
    format: "EAN13",
    width: 1.5,
    height: 30,
    displayValue: true,
    fontSize: 8,
    margin: 2,
  })

  // If format is PNG, download as image
  if (format === "png") {
    // Convert canvas to data URL
    const imageUrl = canvas.toDataURL("image/png")

    // Create download link
    const downloadLink = document.createElement("a")
    downloadLink.href = imageUrl
    downloadLink.download = `barcode-${product.id}.png`
    document.body.appendChild(downloadLink)

    // Trigger download
    downloadLink.click()

    // Clean up
    document.body.removeChild(downloadLink)
    return
  }

  // If format is PDF, download as PDF
  if (format === "pdf" && typeof window !== "undefined") {
    import("jspdf")
      .then(({ default: jsPDF }) => {
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "cm",
          format: [2, 3],
        })

        // Add item code
        doc.setFontSize(6)
        doc.text(`Code: ${itemCode}`, 0.1, 0.3)

        // Add product name
        doc.setFontSize(6)
        doc.text(product.name, 1, 0.6, { align: "center" })

        // Add barcode image
        const imageData = canvas.toDataURL("image/png")
        doc.addImage(imageData, "PNG", 0.1, 0.8, 1.8, 1.2)

        // Add price in English
        doc.setFontSize(8)
        doc.text(`QAR ${priceInQAR}`, 1, 2.3, { align: "center" })

        // Add price in Arabic
        doc.setFontSize(8)
        doc.text(`ر.ق ${priceInArabic}`, 1, 2.6, { align: "center" })

        // Save PDF
        doc.save(`price-tag-${product.id}.pdf`)
      })
      .catch((error) => {
        console.error("Error generating PDF:", error)
      })
  }
}
