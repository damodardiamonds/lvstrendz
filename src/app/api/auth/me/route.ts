
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    const response = NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
    response.cookies.delete("lvs-session");
    return response;
  }

  return NextResponse.json({ user });
}


