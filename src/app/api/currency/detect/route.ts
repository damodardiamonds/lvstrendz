import { NextRequest, NextResponse } from "next/server";
import { CurrencyCode } from "@/lib/currency";

export async function GET(request: NextRequest) {
  try {
    // 1. Check CDN / Proxy country headers
    const countryHeader =
      request.headers.get("x-vercel-ip-country") ||
      request.headers.get("cf-ipcountry") ||
      request.headers.get("x-country") ||
      request.headers.get("x-user-country") ||
      request.headers.get("cloudfront-viewer-country");

    if (countryHeader) {
      const country = countryHeader.toUpperCase();
      const currency: CurrencyCode = country === "IN" ? "INR" : "USD";
      return NextResponse.json({ currency, country, method: "header" });
    }

    // 2. Extract IP from x-forwarded-for or x-real-ip
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : realIp;

    if (
      clientIp &&
      clientIp !== "127.0.0.1" &&
      clientIp !== "::1" &&
      !clientIp.startsWith("192.168.") &&
      !clientIp.startsWith("10.") &&
      !clientIp.startsWith("172.")
    ) {
      try {
        const geoRes = await fetch(`https://api.country.is/${clientIp}`, {
          signal: AbortSignal.timeout(2000),
        });
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          if (geoData && geoData.country) {
            const country = String(geoData.country).toUpperCase();
            const currency: CurrencyCode = country === "IN" ? "INR" : "USD";
            return NextResponse.json({ currency, country, method: "ip-lookup" });
          }
        }
      } catch {
        // IP lookup timeout or error, continue to fallback
      }
    }

    return NextResponse.json({ currency: "INR", country: "IN", method: "default" });
  } catch (error) {
    return NextResponse.json({ currency: "INR", country: "IN", method: "error" });
  }
}
