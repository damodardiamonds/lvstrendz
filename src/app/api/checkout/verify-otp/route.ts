import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePhoneVerificationToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, isFirebase, idToken } = body;

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

    // 1. If Firebase Phone Auth confirmed on client
    if (isFirebase || idToken) {
      try {
        await db.user.updateMany({
          where: { phone: cleanedPhone },
          data: { phoneVerified: true },
        });
      } catch (dbErr) {
        console.error("DB update error on checkout phone verify:", dbErr);
      }

      const token = generatePhoneVerificationToken(cleanedPhone);
      return NextResponse.json({
        success: true,
        verified: true,
        token,
        phone: cleanedPhone,
        message: "Mobile number verified successfully.",
      });
    }

    // 2. Server DB OTP verification (fallback)
    if (!otp || typeof otp !== "string" || otp.trim().length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit OTP code." },
        { status: 400 }
      );
    }

    const otpRecord = await db.otp.findFirst({
      where: {
        phone: cleanedPhone,
        code: otp.trim(),
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP code. Please try again or request a new code." },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await db.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    try {
      await db.user.updateMany({
        where: { phone: cleanedPhone },
        data: { phoneVerified: true },
      });
    } catch (dbErr) {
      console.error("DB update error on fallback verify:", dbErr);
    }

    const token = generatePhoneVerificationToken(cleanedPhone);
    return NextResponse.json({
      success: true,
      verified: true,
      token,
      phone: cleanedPhone,
      message: "Mobile number verified successfully.",
    });
  } catch (error: unknown) {
    console.error("Checkout verify OTP error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
