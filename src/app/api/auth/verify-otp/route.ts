import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { setResponseCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, isFirebase, idToken } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Clean phone number (strip leading +91 or country codes to get 10-digit number)
    const cleanedPhone = phone.replace(/\D/g, "").slice(-10);

    if (cleanedPhone.length !== 10) {
      return NextResponse.json(
        { error: "Valid 10-digit phone number is required" },
        { status: 400 }
      );
    }

    // If Firebase verification was completed on client
    if (isFirebase || idToken) {
      // Find or create user by phone
      let user = await db.user.findUnique({
        where: { phone: cleanedPhone },
      });

      if (!user) {
        user = await db.user.create({
          data: {
            phone: cleanedPhone,
            phoneVerified: true,
            role: "CUSTOMER",
          },
        });
      } else if (!user.phoneVerified) {
        user = await db.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });
      }

      // Generate token and set cookie on response
      const token = generateToken(user.id, user.role);
      const response = NextResponse.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
      });

      setResponseCookie(response, token);
      return response;
    }

    // Fallback DB OTP verification (for non-firebase or dev fallback)
    if (!otp) {
      return NextResponse.json(
        { error: "OTP is required" },
        { status: 400 }
      );
    }

    // Find valid OTP
    const otpRecord = await db.otp.findFirst({
      where: {
        phone: cleanedPhone,
        code: otp,
        type: "LOGIN",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    // Mark OTP as used
    await db.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Find or create user by phone
    let user = await db.user.findUnique({
      where: { phone: cleanedPhone },
    });


    if (!user) {
      user = await db.user.create({
        data: {
          phone,
          phoneVerified: true,
          role: "CUSTOMER",
        },
      });
    } else {
      // Update phone verified status
      await db.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    // Generate token and set cookie on response
    const token = generateToken(user.id, user.role);
    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

    setResponseCookie(response, token);
    return response;
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}

