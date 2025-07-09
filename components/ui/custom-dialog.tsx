"use client"

import * as React from "react"

interface ScrollableContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const ScrollableContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={`flex-1 overflow-y-auto ${className || ""}`} {...props}>
      {children}
    </div>
  ),
)
ScrollableContent.displayName = "ScrollableContent"

export { ScrollableContent }
