import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define public paths that don't require authentication
const isPublicPath = (path: string) => {
  return (
    path === "/" ||
    path.startsWith("/admin") ||
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/favicon") ||
    path.startsWith("/images") ||
    path.includes(".") // Allow all static files
  )
}

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is public
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // For protected routes, we'll let the client-side authentication handle it
  // This prevents the middleware from causing redirect loops
  return NextResponse.next()
}

// Only match dashboard routes
export const config = {
  matcher: ["/dashboard/:path*"],
}
