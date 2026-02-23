import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";
import { rateLimit } from "@/lib/rateLimit";
import { getSessionUser } from "@/lib/session";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  const rl = await rateLimit(req, "search", user?.id);
  if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  const results = await search(q, limit);
  return NextResponse.json({ results });
}
