"use client"

// Helper function to convert English numerals to Arabic numerals
export function toArabicNumerals(str: string): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
  return str.replace(/[0-9]/g, (match) => arabicNumerals[Number.parseInt(match)])
}

// Generate a valid EAN-13 barcode with proper check digit
export function generateEAN13(): string {
  let code = "200"
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(code[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10
  return code + checkDigit
}

// Validate an EAN-13 barcode
export function validateEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) {
    return false
  }
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const calculatedCheckDigit = (10 - (sum % 10)) % 10
  return calculatedCheckDigit === Number.parseInt(barcode[12])
}

// Function to encode a number using Alphabetic Digit Cipher
export function encodeNumberAsLetters(num: number): string {
  if (num <= 0) return ""
  const numStr = num.toString()
  let result = ""
  for (let i = 0; i < numStr.length; i++) {
    const digit = Number.parseInt(numStr[i])
    if (digit === 0) {
      result += "J"
    } else {
      result += String.fromCharCode(64 + digit)
    }
  }
  return result
}

// Print single barcode sticker - TVS LP40 DLITE PLUS format (38x25mm, 2 per row)
export function printBarcodeSticker(product: any, currency = "AED") {
  if (!product) return

  const productCode = product.id ? product.id.toString().padStart(4, "0") : "0000"
  const price = typeof product.price === "number" ? product.price.toFixed(2) : (Number.parseFloat(product.price || "0") || 0).toFixed(2)
  const arabicPrice = toArabicNumerals(price)
  
  let barcodeValue = product.barcode || ""
  if (!barcodeValue || !validateEAN13(barcodeValue)) {
    barcodeValue = generateEAN13()
  }

  const wholesalePrice = typeof product.wholesale_price === "number" ? product.wholesale_price : Number.parseFloat(product.wholesale_price || "0") || 0
  const encodedWholesalePrice = encodeNumberAsLetters(Math.round(wholesalePrice))

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow pop-ups to print price tags")
    return
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TVS LP40 Price Tag - ${product.name}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          width: 80mm;
          min-width: 80mm;
          max-width: 80mm;
          margin: 0;
          padding: 2mm;
          background: #f0f0f0;
        }
        
        .sticker-row {
          width: 76mm;
          display: flex;
          flex-direction: row;
          gap: 2mm;
          page-break-inside: avoid;
          margin-bottom: 2mm;
        }
        
        .sticker {
          width: 37mm;
          min-width: 37mm;
          max-width: 37mm;
          height: 24mm;
          min-height: 24mm;
          max-height: 24mm;
          border: 1px solid #000;
          border-radius: 2mm;
          padding: 1mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
          position: relative;
          page-break-inside: avoid;
        }
        
        .company-name {
          font-size: 5.5pt;
          font-weight: bold;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.1;
          max-height: 2.5mm;
        }
        
        .encoded-price {
          position: absolute;
          top: 1mm;
          right: 1mm;
          font-size: 5pt;
          font-weight: bold;
          color: #000;
          background: rgba(255,255,255,0.8);
          padding: 0.5mm;
          border-radius: 0.5mm;
        }
        
        .product-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1mm;
        }
        
        .product-name {
          font-size: 6pt;
          font-weight: bold;
          flex: 1;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          color: #000;
        }
        
        .product-code {
          font-size: 5pt;
          color: #000;
          font-weight: bold;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .barcode-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
        }
        
        .barcode {
          width: 33mm;
          height: 8mm;
        }
        
        .barcode-number {
          font-size: 4pt;
          text-align: center;
          margin-top: 0.5mm;
        }
        
        .price-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 0.5px solid #ccc;
          padding-top: 0.5mm;
          gap: 1mm;
        }
        
        .price-english {
          font-size: 8pt;
          font-weight: bold;
          white-space: nowrap;
          color: #000;
        }
        
        .price-arabic {
          font-size: 7pt;
          font-weight: bold;
          direction: rtl;
          white-space: nowrap;
          color: #000;
        }
        
        .print-button {
          position: fixed;
          top: 10px;
          right: 10px;
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          z-index: 1000;
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">Print</button>
      
      <div class="sticker-row">
        <div class="sticker">
          <div class="company-name">${product.company_name || "Al Aneeq"}</div>
          ${encodedWholesalePrice ? `<div class="encoded-price">${encodedWholesalePrice}</div>` : ""}
          <div class="product-info">
            <div class="product-name">${product.name || "Product"}</div>
            <div class="product-code">#${productCode}</div>
          </div>
          <div class="barcode-container">
            <svg class="barcode" id="barcode1"></svg>
            <div class="barcode-number">${barcodeValue}</div>
          </div>
          <div class="price-container">
            <div class="price-english">${currency} ${price}</div>
            <div class="price-arabic">${arabicPrice} ${currency}</div>
          </div>
        </div>
        
        <div class="sticker">
          <div class="company-name">${product.company_name || "Al Aneeq"}</div>
          ${encodedWholesalePrice ? `<div class="encoded-price">${encodedWholesalePrice}</div>` : ""}
          <div class="product-info">
            <div class="product-name">${product.name || "Product"}</div>
            <div class="product-code">#${productCode}</div>
          </div>
          <div class="barcode-container">
            <svg class="barcode" id="barcode2"></svg>
            <div class="barcode-number">${barcodeValue}</div>
          </div>
          <div class="price-container">
            <div class="price-english">${currency} ${price}</div>
            <div class="price-arabic">${arabicPrice} ${currency}</div>
          </div>
        </div>
      </div>

      <script>
        try {
          JsBarcode("#barcode1", "${barcodeValue}", {
            format: "EAN13",
            width: 1,
            height: 30,
            displayValue: false,
            margin: 0
          });
          
          JsBarcode("#barcode2", "${barcodeValue}", {
            format: "EAN13",
            width: 1,
            height: 30,
            displayValue: false,
            margin: 0
          });
        } catch (error) {
          console.error("Barcode generation error:", error);
        }
        
        setTimeout(() => {
          window.print();
        }, 1000);
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}

// Print multiple barcode stickers - TVS LP40 format
export function printMultipleBarcodeStickers(products: any[], copies = 1, currency = "AED") {
  if (!products || products.length === 0) return

  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow pop-ups to print price tags")
    return
  }

  let stickerRows = ""
  let barcodeScripts = ""
  let barcodeIndex = 0
  let totalStickers = 0

  products.forEach((product) => {
    const productCode = product.id ? product.id.toString().padStart(4, "0") : "0000"
    const price = typeof product.price === "number" ? product.price.toFixed(2) : (Number.parseFloat(product.price || "0") || 0).toFixed(2)
    const arabicPrice = toArabicNumerals(price)
    
    let barcodeValue = product.barcode || ""
    if (!barcodeValue || !validateEAN13(barcodeValue)) {
      barcodeValue = generateEAN13()
    }

    const wholesalePrice = typeof product.wholesale_price === "number" ? product.wholesale_price : Number.parseFloat(product.wholesale_price || "0") || 0
    const encodedWholesalePrice = encodeNumberAsLetters(Math.round(wholesalePrice))

    for (let copy = 0; copy < copies; copy++) {
      if (totalStickers % 2 === 0) {
        stickerRows += '<div class="sticker-row">'
      }
      
      const barcodeId = `barcode${barcodeIndex}`
      barcodeIndex++
      totalStickers++

      stickerRows += `
        <div class="sticker">
          <div class="company-name">${product.company_name || "Al Aneeq"}</div>
          ${encodedWholesalePrice ? `<div class="encoded-price">${encodedWholesalePrice}</div>` : ""}
          <div class="product-info">
            <div class="product-name">${product.name || "Product"}</div>
            <div class="product-code">#${productCode}</div>
          </div>
          <div class="barcode-container">
            <svg class="barcode" id="${barcodeId}"></svg>
            <div class="barcode-number">${barcodeValue}</div>
          </div>
          <div class="price-container">
            <div class="price-english">${currency} ${price}</div>
            <div class="price-arabic">${arabicPrice} ${currency}</div>
          </div>
        </div>
      `

      if (totalStickers % 2 === 0) {
        stickerRows += '</div>'
      }

      barcodeScripts += `
        JsBarcode("#${barcodeId}", "${barcodeValue}", {
          format: "EAN13",
          width: 1,
          height: 30,
          displayValue: false,
          margin: 0
        });
      `
    }
  })

  // Close last row if odd number of stickers
  if (totalStickers % 2 !== 0) {
    stickerRows += '</div>'
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>TVS LP40 Batch Print - ${totalStickers} stickers</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: Arial, sans-serif;
          width: 80mm;
          min-width: 80mm;
          max-width: 80mm;
          margin: 0;
          padding: 2mm;
          background: #f0f0f0;
        }
        
        .sticker-row {
          width: 76mm;
          display: flex;
          flex-direction: row;
          gap: 2mm;
          page-break-inside: avoid;
          margin-bottom: 2mm;
        }
        
        .sticker {
          width: 37mm;
          min-width: 37mm;
          max-width: 37mm;
          height: 24mm;
          min-height: 24mm;
          max-height: 24mm;
          border: 1px solid #000;
          border-radius: 2mm;
          padding: 1mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: white;
          position: relative;
          page-break-inside: avoid;
        }
        
        .company-name {
          font-size: 6pt;
          font-weight: bold;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
        }
        
        .encoded-price {
          position: absolute;
          top: 1mm;
          right: 1mm;
          font-size: 4pt;
          font-weight: bold;
          color: #666;
        }
        
        .product-info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1mm;
        }
        
        .product-name {
          font-size: 5pt;
          font-weight: bold;
          flex: 1;
          line-height: 1.1;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .product-code {
          font-size: 4pt;
          color: #666;
          white-space: nowrap;
          flex-shrink: 0;
        }
        
        .barcode-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
        }
        
        .barcode {
          width: 33mm;
          height: 8mm;
        }
        
        .barcode-number {
          font-size: 4pt;
          text-align: center;
          margin-top: 0.5mm;
        }
        
        .price-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 0.5px solid #ccc;
          padding-top: 0.5mm;
          gap: 1mm;
        }
        
        .price-english {
          font-size: 7pt;
          font-weight: bold;
          white-space: nowrap;
        }
        
        .price-arabic {
          font-size: 6pt;
          font-weight: bold;
          direction: rtl;
          white-space: nowrap;
        }
        
        .controls {
          position: fixed;
          top: 10px;
          right: 10px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          z-index: 1000;
        }
        
        .print-button {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          width: 100%;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <div class="controls no-print">
        <h3 style="margin-bottom: 10px;">TVS LP40 Batch Print</h3>
        <p><strong>Total stickers:</strong> ${totalStickers}</p>
        <p><strong>Products:</strong> ${products.length}</p>
        <p><strong>Copies each:</strong> ${copies}</p>
        <p><strong>Format:</strong> 38×25mm</p>
        <button class="print-button" onclick="window.print()">Print All</button>
      </div>
      
      ${stickerRows}

      <script>
        console.log("🎯 Batch print loaded - ${totalStickers} stickers");
        
        try {
          ${barcodeScripts}
          console.log("✅ All barcodes generated successfully");
        } catch (error) {
          console.error("❌ Barcode generation error:", error);
        }
        
        setTimeout(() => {
          window.print();
        }, 1500);
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}
