
// src/app/api/debug-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const reports: Record<string, any> = {};

  try {
    // 1. Read cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    reports.cookiesCount = allCookies.length;
    reports.cookiesNames = allCookies.map(c => c.name);

    const tokenCookie = cookieStore.get("lvs-session");
    reports.tokenCookieExists = !!tokenCookie;

    if (tokenCookie) {
      reports.tokenValueSnippet = tokenCookie.value.substring(0, 15) + "...";
      
      // 2. Verify token
      try {
        const payload = verifyToken(tokenCookie.value);
        reports.tokenPayload = payload;
        
        if (payload && payload.userId) {
          // 3. Query user
          try {
            const user = await db.user.findUnique({
              where: { id: payload.userId },
              select: {
                id: true,
                email: true,
                name: true,
                role: true
              }
            });
            reports.databaseUser = user;
            reports.isUserAdmin = user ? user.role === "ADMIN" : false;
          } catch (dbErr: any) {
            reports.databaseError = dbErr.message;
          }
        } else {
          reports.tokenVerificationError = "Payload is null or has no userId";
        }
      } catch (jwtErr: any) {
        reports.tokenVerificationError = jwtErr.message;
      }
    } else {
      reports.tokenVerificationError = "lvs-session cookie is not present in request";
    }

    // 4. System info
    reports.envNodeEnv = process.env.NODE_ENV;
    reports.envHasJwtSecret = !!process.env.JWT_SECRET;
    
  } catch (err: any) {
    reports.globalError = err.message;
  }

  return NextResponse.json(reports);
}
