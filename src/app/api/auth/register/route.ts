import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

const schema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上にしてください"),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, "auth/register");
  if (rl) return rl;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "入力が正しくありません" },
      { status: 400 }
    );
  }

  const { email, password, name } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "このメールアドレスは既に使用されています" }, { status: 409 });
  }

  const hashed = await hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashed, name },
  });

  const token = await createSessionToken(user.id);
  setSessionCookie(token);

  return NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
}
