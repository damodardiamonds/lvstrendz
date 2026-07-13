import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "./auth";
import { db } from "./db";

const COOKIE_NAME = "lvs-session";

// Set session cookie on response directly (required for Route Handlers returning custom responses)
export function setResponseCookie(response: NextResponse, token: string) {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Set session cookie (falls back to cookies() store, useful for actions/middleware)
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Get current user from session (supports cookies, Authorization header, and X-Admin-Token header)
export async function getCurrentUser() {
  const cookieStore = await cookies();
  let token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    const reqHeaders = await headers();
    const authHeader = reqHeaders.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      token = reqHeaders.get("X-Admin-Token") || undefined;
    }
  }

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      avatar: true,
      createdAt: true,
    },
  });

  return user;
}

// Get admin user helper
export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

// Clear session cookie (logout)
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

