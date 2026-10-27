import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateOTP } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    const cleanedPhone = String(phone).replace(/\D/g, "").slice(-10);
    if (cleanedPhone.length !== 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Rate-limit: avoid spamming OTP requests within 20 seconds
    const recentOtp = await db.otp.findFirst({
      where: {
        phone: cleanedPhone,
        createdAt: { gt: new Date(Date.now() - 20 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentOtp) {
      return NextResponse.json(
        { error: "Please wait a few seconds before requesting another OTP." },
        { status: 429 }
      );
    }

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    await db.otp.create({
      data: {
        phone: cleanedPhone,
        code,
        type: "PHONE_VERIFICATION",
        expiresAt,
      },
    });

    console.log(`\n📱 [Checkout 2FA OTP] For +91 ${cleanedPhone}: ${code}\n`);

    return NextResponse.json({
      success: true,
      message: `OTP sent to +91 ${cleanedPhone}`,
      devOtp: process.env.NODE_ENV === "development" ? code : undefined,
    });
  } catch (error: unknown) {
    console.error("Checkout send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
