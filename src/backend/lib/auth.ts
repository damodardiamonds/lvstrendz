
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "lvs-trendz-default-jwt-secret-key-123456";

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  } catch {
    return null;
  }
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate signed phone verification token for checkout 2FA
export function generatePhoneVerificationToken(phone: string): string {
  const cleanedPhone = phone.replace(/\D/g, "").slice(-10);
  return jwt.sign(
    { phone: cleanedPhone, purpose: "order_phone_verification" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// Verify signed phone verification token for checkout 2FA
export function verifyPhoneVerificationToken(token: string, phone: string): boolean {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { phone: string; purpose: string };
    const cleanedPhone = phone.replace(/\D/g, "").slice(-10);
    return Boolean(
      payload &&
      payload.purpose === "order_phone_verification" &&
      payload.phone === cleanedPhone
    );
  } catch {
    return false;
  }
}

