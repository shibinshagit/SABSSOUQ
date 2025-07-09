"use client"

import { useEffect, useRef } from "react"

interface ChartData {
  labels: string[]
  values: number[]
  colors?: string[]
}

interface FinanceChartProps {
  data: ChartData
  type: "bar" | "line" | "pie"
  title?: string
  height?: number
  currency?: string
}

export default function FinanceChart({ data, type, title, height = 200, currency = "QAR" }: FinanceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data.labels.length) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    // Set dimensions
    const width = canvasRef.current.width
    const chartHeight = canvasRef.current.height - 40 // Leave space for labels

    // Default colors if not provided
    const colors = data.colors || [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
      "#f97316",
      "#6366f1",
    ]

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

    if (type === "bar") {
      // Find max value for scaling
      const maxValue = Math.max(...data.values, 1) // Ensure at least 1 to avoid division by zero

      // Draw bars
      const barWidth = (width - 40) / data.labels.length
      const barSpacing = barWidth * 0.2
      const actualBarWidth = barWidth - barSpacing

      // Draw y-axis labels (amount)
      ctx.fillStyle = "#6b7280"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"

      // Draw 3 horizontal lines with labels
      for (let i = 0; i <= 3; i++) {
        const y = chartHeight - chartHeight * (i / 3)
        const value = maxValue * (i / 3)

        ctx.fillStyle = "#e5e7eb"
        ctx.beginPath()
        ctx.moveTo(30, y)
        ctx.lineTo(width - 10, y)
        ctx.stroke()

        ctx.fillStyle = "#6b7280"
        ctx.fillText(formatCurrency(value), 25, y + 4)
      }

      // Draw bars
      data.labels.forEach((label, i) => {
        const x = 30 + i * barWidth + barSpacing / 2
        const barHeight = (data.values[i] / maxValue) * chartHeight
        const y = chartHeight - barHeight

        // Draw bar
        ctx.fillStyle = colors[i % colors.length]
        ctx.fillRect(x, y, actualBarWidth, barHeight)

        // Draw label
        ctx.fillStyle = "#6b7280"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(label, x + actualBarWidth / 2, chartHeight + 15)

        // Draw value on top of bar
        ctx.fillStyle = "#374151"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        if (barHeight > 20) {
          // Only show value if bar is tall enough
          ctx.fillText(formatCurrency(data.values[i]), x + actualBarWidth / 2, y + 15)
        }
      })
    } else if (type === "pie") {
      // Calculate total
      const total = data.values.reduce((sum, value) => sum + value, 0)

      // Draw pie chart - use much smaller dimensions to fit container
      // Reduce the size of the pie chart significantly
      const centerX = width / 2
      const centerY = chartHeight / 2
      // Make the radius much smaller
      const radius = Math.min(centerX, centerY) * 0.6

      // Draw pie slices
      let startAngle = 0

      // Draw pie slices
      data.values.forEach((value, i) => {
        const sliceAngle = (value / total) * 2 * Math.PI
        const endAngle = startAngle + sliceAngle

        ctx.beginPath()
        ctx.moveTo(centerX, centerY)
        ctx.arc(centerX, centerY, radius, startAngle, endAngle)
        ctx.closePath()

        ctx.fillStyle = colors[i % colors.length]
        ctx.fill()

        // Draw label line and text if slice is big enough
        if (sliceAngle > 0.2) {
          const midAngle = startAngle + sliceAngle / 2
          const labelRadius = radius * 0.7
          const labelX = centerX + Math.cos(midAngle) * labelRadius
          const labelY = centerY + Math.sin(midAngle) * labelRadius

          ctx.fillStyle = "#ffffff"
          ctx.font = "bold 9px sans-serif" // Smaller font
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"

          // Calculate percentage
          const percentage = Math.round((value / total) * 100)
          if (percentage >= 5) {
            // Only show label if slice is at least 5%
            ctx.fillText(`${percentage}%`, labelX, labelY)
          }
        }

        startAngle = endAngle
      })

      // Draw legend - position it to the right of the pie chart
      const legendX = width * 0.65 // Move legend to the right
      const legendY = 10

      // Draw legend with smaller text and more compact layout
      data.labels.forEach((label, i) => {
        const y = legendY + i * 15 // Reduce vertical spacing

        // Truncate long labels
        const displayLabel = label.length > 10 ? label.substring(0, 10) + "..." : label

        // Draw color box
        ctx.fillStyle = colors[i % colors.length]
        ctx.fillRect(legendX, y, 8, 8) // Smaller color box

        // Draw label
        ctx.fillStyle = "#374151"
        ctx.font = "8px sans-serif" // Smaller font
        ctx.textAlign = "left"
        ctx.fillText(displayLabel, legendX + 12, y + 6)
      })
    } else if (type === "line") {
      // Find max value for scaling
      const maxValue = Math.max(...data.values, 1) // Ensure at least 1 to avoid division by zero

      // Draw y-axis labels (amount)
      ctx.fillStyle = "#6b7280"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"

      // Draw 3 horizontal lines with labels
      for (let i = 0; i <= 3; i++) {
        const y = chartHeight - chartHeight * (i / 3)
        const value = maxValue * (i / 3)

        ctx.fillStyle = "#e5e7eb"
        ctx.beginPath()
        ctx.moveTo(30, y)
        ctx.lineTo(width - 10, y)
        ctx.stroke()

        ctx.fillStyle = "#6b7280"
        ctx.fillText(formatCurrency(value), 25, y + 4)
      }

      // Draw line
      const pointWidth = (width - 40) / (data.labels.length - 1)

      ctx.beginPath()
      ctx.strokeStyle = colors[0]
      ctx.lineWidth = 2

      data.values.forEach((value, i) => {
        const x = 30 + i * pointWidth
        const y = chartHeight - (value / maxValue) * chartHeight

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

      // Draw points
      data.values.forEach((value, i) => {
        const x = 30 + i * pointWidth
        const y = chartHeight - (value / maxValue) * chartHeight

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fillStyle = colors[0]
        ctx.fill()
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 1
        ctx.stroke()

        // Draw label
        ctx.fillStyle = "#6b7280"
        ctx.font = "10px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(data.labels[i], x, chartHeight + 15)
      })
    }

    // Draw title if provided
    if (title) {
      ctx.fillStyle = "#374151"
      ctx.font = "bold 12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(title, width / 2, 15)
    }
  }, [data, type, title, height, currency])

  return <canvas ref={canvasRef} width={500} height={height} className="w-full h-auto" />
}
