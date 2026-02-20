import { NextResponse } from "next/server";
import { deleteSession, clearSessionCookie } from "@/lib/session";

export async function POST() {
  await deleteSession();
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
