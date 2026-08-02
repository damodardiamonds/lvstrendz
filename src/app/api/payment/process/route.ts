import { NextResponse } from "next/server";

// Deprecated: Direct payment process API is removed. All payments are processed via PayGlocal gateway redirection.
export async function POST() {
  return NextResponse.json(
    { error: "Direct payment processing is deprecated. Please process payments via PayGlocal gateway." },
    { status: 410 }
  );
}
