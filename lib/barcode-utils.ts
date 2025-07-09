"use client"

// Helper function to convert English numerals to Arabic numerals
export function toArabicNumerals(str: string): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"]
  return str.replace(/[0-9]/g, (match) => arabicNumerals[Number.parseInt(match)])
}

// Generate a valid EAN-13 barcode with proper check digit
export function generateEAN13(): string {
  // Start with a standard prefix (e.g., 200 for in-store products)
  let code = "200"

  // Generate 9 random digits for the middle part
  for (let i = 0; i < 9; i++) {
    code += Math.floor(Math.random() * 10).toString()
  }

  // Calculate check digit according to EAN-13 algorithm
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(code[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const checkDigit = (10 - (sum % 10)) % 10

  return code + checkDigit
}

// Validate an EAN-13 barcode
export function validateEAN13(barcode: string): boolean {
  // Check if it's exactly 13 digits
  if (!/^\d{13}$/.test(barcode)) {
    return false
  }

  // Calculate check digit
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += Number.parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const calculatedCheckDigit = (10 - (sum % 10)) % 10

  // Compare with the provided check digit
  return calculatedCheckDigit === Number.parseInt(barcode[12])
}

// Function to encode a number using Alphabetic Digit Cipher (A=1, B=2, ..., I=9, J=0)
export function encodeNumberAsLetters(num: number): string {
  if (num <= 0) return ""

  // Convert the number to a string
  const numStr = num.toString()
  let result = ""

  // Map each digit to its corresponding letter
  for (let i = 0; i < numStr.length; i++) {
    const digit = Number.parseInt(numStr[i])
    // A=1, B=2, ..., I=9, J=0
    if (digit === 0) {
      result += "J"
    } else {
      // ASCII code for 'A' is 65, so we add digit-1 to get the correct letter
      result += String.fromCharCode(64 + digit)
    }
  }

  return result
}

// Update the printBarcodeSticker function to use AED as default currency
export function printBarcodeSticker(product: any, currency = "AED") {
  if (!product) return

  // Format the product code (ID) as a 4-digit number
  const productCode = product.id ? product.id.toString().padStart(4, "0") : "0000"

  // Format the price with 2 decimal places
  const price =
    typeof product.price === "number"
      ? product.price.toFixed(2)
      : (Number.parseFloat(product.price || "0") || 0).toFixed(2)

  // Convert price to Arabic numerals
  const arabicPrice = toArabicNumerals(price)

  // Ensure barcode is valid EAN-13
  let barcodeValue = product.barcode || ""
  if (!barcodeValue || !validateEAN13(barcodeValue)) {
    barcodeValue = generateEAN13()
  }

  // Get wholesale price and encode it
  const wholesalePrice =
    typeof product.wholesale_price === "number"
      ? product.wholesale_price
      : Number.parseFloat(product.wholesale_price || "0") || 0

  // Encode the wholesale price as letters using Alphabetic Digit Cipher
  const encodedWholesalePrice = encodeNumberAsLetters(Math.round(wholesalePrice))

  // Create a new window for printing
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow pop-ups to print price tags")
    return
  }

  // Set the content of the print window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Price Tag</title>
      <style>
        @media print {
          @page {
            size: 30mm 20mm; /* 3cm x 2cm */
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            width: 30mm;
            height: 20mm;
          }
          .no-print {
            display: none;
          }
        }
        
        body {
          margin: 0;
          padding: 0;
          width: 30mm; /* 3cm */
          height: 20mm; /* 2cm */
          font-family: Arial, sans-serif;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .tag {
          width: 28mm; /* 30mm - 2mm padding */
          height: 18mm; /* 20mm - 2mm padding */
          border: 0.2mm solid black;
          border-radius: 1mm;
          padding: 1mm;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: auto auto auto auto;
          background-color: white;
        }
        
        .company-name {
          font-size: 6pt;
          font-weight: bold;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .product-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .product-name {
          font-size: 5pt;
          font-weight: bold;
          max-width: 70%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .product-code {
          font-size: 4pt;
          text-align: right;
        }
        
        .barcode-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .barcode {
          width: 26mm;
          height: 7mm;
        }
        
        .barcode-number {
          font-size: 4pt;
          text-align: center;
          margin-top: 0.5mm;
        }
        
        .price-container {
          display: flex;
          justify-content: space-between;
          font-size: 6pt;
          font-weight: bold;
        }
        
        .price-english {
          text-align: left;
        }
        
        .price-arabic {
          text-align: right;
          direction: rtl;
        }
        
        .print-button {
          position: fixed;
          top: 30mm;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        }
        
        .encoded-price {
          position: absolute;
          top: 1mm;
          right: 1mm;
          font-size: 4pt;
          font-weight: bold;
        }
        
        @media screen {
          body {
            background: #f0f0f0;
            padding: 20px;
            height: auto;
            min-height: 100vh;
          }
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <div class="tag">
        <div class="company-name">${product.company_name || "Al Aneeq"}</div>
        ${encodedWholesalePrice ? `<div class="encoded-price">${encodedWholesalePrice}</div>` : ""}
        <div class="product-info">
          <div class="product-name">${product.name || "Product"}</div>
          <div class="product-code">${productCode}</div>
        </div>
        <div class="barcode-container">
          <svg class="barcode" id="barcode"></svg>
          <div class="barcode-number">${barcodeValue}</div>
        </div>
        <div class="price-container">
          <div class="price-english">${currency}: ${price}</div>
          <div class="price-arabic">${arabicPrice} :${currency === "AED" ? "د.إ" : currency}</div>
        </div>
      </div>

      <button class="print-button no-print" onclick="window.print()">Print</button>

      <script>
        JsBarcode("#barcode", "${barcodeValue}", {
          format: "EAN13",
          width: 1,
          height: 25,
          displayValue: false,
          margin: 0,
          fontSize: 0
        });
        
        // Auto print after a short delay
        setTimeout(() => {
          window.print();
        }, 1000);
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}

// Update the printMultipleBarcodeStickers function to use AED as default currency
export function printMultipleBarcodeStickers(products: any[], copies = 1, currency = "AED") {
  if (!products || products.length === 0) return

  // Create a new window for printing
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow pop-ups to print price tags")
    return
  }

  // Start building the HTML content
  let tagsHtml = ""

  // Generate HTML for each product, repeated by the number of copies
  products.forEach((product) => {
    // Format the product code (ID) as a 4-digit number
    const productCode = product.id ? product.id.toString().padStart(4, "0") : "0000"

    // Format the price with 2 decimal places
    const price =
      typeof product.price === "number"
        ? product.price.toFixed(2)
        : (Number.parseFloat(product.price || "0") || 0).toFixed(2)

    // Convert price to Arabic numerals
    const arabicPrice = toArabicNumerals(price)

    // Ensure barcode is valid EAN-13
    let barcodeValue = product.barcode || ""
    if (!barcodeValue || !validateEAN13(barcodeValue)) {
      barcodeValue = generateEAN13()
    }

    // Get wholesale price and encode it
    const wholesalePrice =
      typeof product.wholesale_price === "number"
        ? product.wholesale_price
        : Number.parseFloat(product.wholesale_price || "0") || 0

    // Encode the wholesale price as letters using Alphabetic Digit Cipher
    const encodedWholesalePrice = encodeNumberAsLetters(Math.round(wholesalePrice))

    // Add the specified number of copies
    for (let i = 0; i < copies; i++) {
      tagsHtml += `
        <div class="tag" data-barcode="${barcodeValue}">
          <div class="company-name">${product.company_name || "Al Aneeq"}</div>
          ${encodedWholesalePrice ? `<div class="encoded-price">${encodedWholesalePrice}</div>` : ""}
          <div class="product-info">
            <div class="product-name">${product.name || "Product"}</div>
          <div class="product-code">${productCode}</div>
          </div>
          <div class="barcode-container">
            <svg class="barcode barcode-${barcodeValue.replace(/[^0-9]/g, "")}-${i}"></svg>
            <div class="barcode-number">${barcodeValue}</div>
          </div>
          <div class="price-container">
            <div class="price-english">${currency}: ${price}</div>
            <div class="price-arabic">${arabicPrice} :${currency === "AED" ? "د.إ" : currency}</div>
          </div>
        </div>
      `
    }
  })

  // Set the content of the print window
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Price Tags</title>
      <style>
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
        
        body {
          margin: 0;
          padding: 10px;
          font-family: Arial, sans-serif;
        }
        
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 2mm;
          justify-content: flex-start;
        }
        
        .tag {
          width: 28mm;
          height: 18mm;
          border: 0.2mm solid black;
          border-radius: 1mm;
          padding: 1mm;
          box-sizing: border-box;
          display: grid;
          grid-template-rows: auto auto auto auto;
          background-color: white;
          page-break-inside: avoid;
          position: relative;
        }
        
        .company-name {
          font-size: 6pt;
          font-weight: bold;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .product-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .product-name {
          font-size: 5pt;
          font-weight: bold;
          max-width: 70%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .product-code {
          font-size: 4pt;
          text-align: right;
        }
        
        .barcode-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .barcode {
          width: 26mm;
          height: 7mm;
        }
        
        .barcode-number {
          font-size: 4pt;
          text-align: center;
          margin-top: 0.5mm;
        }
        
        .price-container {
          display: flex;
          justify-content: space-between;
          font-size: 6pt;
          font-weight: bold;
        }
        
        .price-english {
          text-align: left;
        }
        
        .price-arabic {
          text-align: right;
          direction: rtl;
        }
        
        .encoded-price {
          position: absolute;
          top: 1mm;
          right: 1mm;
          font-size: 4pt;
          font-weight: bold;
        }
        
        .controls {
          position: fixed;
          top: 10px;
          right: 10px;
          background: white;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 1000;
        }
        
        .print-button {
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
          margin-top: 10px;
        }
        
        @media screen {
          body {
            background: #f0f0f0;
          }
        }
      </style>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
    </head>
    <body>
      <div class="controls no-print">
        <h3>Batch Print Price Tags</h3>
        <p>Total tags: ${products.length * copies}</p>
        <button class="print-button" onclick="window.print()">Print All Tags</button>
      </div>
      
      <div class="tags-container">
        ${tagsHtml}
      </div>

      <script>
        // Function to render all barcodes
        function renderBarcodes() {
          // Get all tags
          const tags = document.querySelectorAll('.tag');
          
          // Configure each barcode
          tags.forEach((tag) => {
            const barcodeValue = tag.getAttribute('data-barcode');
            const barcodeElement = tag.querySelector('.barcode');
            
            if (barcodeElement && barcodeValue) {
              JsBarcode(barcodeElement, barcodeValue, {
                format: "EAN13",
                width: 1,
                height: 25,
                displayValue: false,
                margin: 0,
                fontSize: 0
              });
            }
          });
        }
        
        // Render all barcodes
        renderBarcodes();
        
        // Auto print after a short delay
        setTimeout(() => {
          window.print();
        }, 1500);
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}
