export function printPriceTag(product: any, currency = "AED") {
  // Create a new window
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow pop-ups to print price tags")
    return
  }

  // Set up the document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Price Tag - ${product.name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .price-tag {
          width: 58mm;
          height: 30mm;
          padding: 2mm;
          box-sizing: border-box;
          text-align: center;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .product-name {
          font-size: 14px;
          font-weight: bold;
          margin: 3px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-price {
          font-size: 24px;
          font-weight: bold;
          margin: 5px 0;
        }
        .arabic-text {
          font-size: 18px;
          direction: rtl;
          margin: 3px 0;
        }
        @media print {
          @page {
            size: 58mm 30mm;
            margin: 0;
          }
          body {
            margin: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="price-tag">
        <div class="product-name">${product.name}</div>
        <div class="product-price">${currency} ${
          typeof product.price === "number" ? product.price.toFixed(2) : product.price
        }</div>
        <div class="arabic-text">د.إ ${
          typeof product.price === "number" ? product.price.toFixed(2) : product.price
        }</div>
      </div>
      <script>
        // Print automatically
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          }, 500);
        };
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}

export function printMultiplePriceTags(products: any[], quantity = 1, currency = "AED") {
  // Create a new window
  const printWindow = window.open("", "_blank")
  if (!printWindow) {
    alert("Please allow pop-ups to print price tags")
    return
  }

  // Set up the document
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Price Tags</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }
        .tag-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-start;
        }
        .price-tag {
          width: 58mm;
          height: 30mm;
          padding: 2mm;
          box-sizing: border-box;
          text-align: center;
          page-break-after: auto;
          border: 1px dashed #ccc;
          margin: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .product-name {
          font-size: 14px;
          font-weight: bold;
          margin: 3px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-price {
          font-size: 24px;
          font-weight: bold;
          margin: 5px 0;
        }
        .arabic-text {
          font-size: 18px;
          direction: rtl;
          margin: 3px 0;
        }
        @media print {
          @page {
            size: auto;
            margin: 0;
          }
          body {
            margin: 0;
          }
          .price-tag {
            border: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="tag-container">
        ${products
          .map(
            (product) => `
          ${Array(quantity)
            .fill(0)
            .map(
              () => `
            <div class="price-tag">
              <div class="product-name">${product.name}</div>
              <div class="product-price">${currency} ${
                typeof product.price === "number" ? product.price.toFixed(2) : product.price
              }</div>
              <div class="arabic-text">د.إ ${
                typeof product.price === "number" ? product.price.toFixed(2) : product.price
              }</div>
            </div>
          `,
            )
            .join("")}
        `,
          )
          .join("")}
      </div>
      <script>
        // Print automatically
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          }, 500);
        };
      </script>
    </body>
    </html>
  `)

  printWindow.document.close()
}
