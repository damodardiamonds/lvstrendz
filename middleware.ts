
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./lib/auth";

// Routes that require authentication
const protectedRoutes = ["/account", "/wishlist", "/orders"];

// Routes that require admin role
const adminRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("lvs-session")?.value;

  // Check protected routes
  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdmin = adminRoutes.some((route) => pathname.startsWith(route));

  if (isProtected || isAdmin) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = verifyToken(token);

    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin routes require ADMIN role
    if (isAdmin && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect logged-in users away from login/register pages
  if (pathname === "/login" || pathname === "/register") {
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL("/account", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/wishlist/:path*",
    "/orders/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};

