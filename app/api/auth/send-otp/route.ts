
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOTP } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || phone.length !== 10) {
      return NextResponse.json(
        { error: "Valid 10-digit phone number is required" },
        { status: 400 }
      );
    }

    // Generate OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP to database
    await db.otp.create({
      data: {
        phone,
        code,
        type: "LOGIN",
        expiresAt,
      },
    });

    // TODO: Send OTP via SMS provider (MSG91, Twilio, etc.)
    // For now, log it to console during development
    console.log(`\n📱 OTP for +91 ${phone}: ${code}\n`);

    return NextResponse.json({
      message: "OTP sent successfully",
      // Remove this in production - only for development testing
      devOtp: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP. Please try again." },
      { status: 500 }
    );
  }
}

