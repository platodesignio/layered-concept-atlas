import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isAuthUser } from "@/lib/auth";

export async function GET() {
  const admin = await requireAdmin();
  if (!isAuthUser(admin)) return admin;

  const packs = await prisma.packVersion.findMany({ orderBy: { createdAt: "desc" } });
  const conceptCount = await prisma.concept.count();
  const layerCount = await prisma.layerDefinition.count();
  const dictCount = await prisma.dictionaryTerm.count();

  return NextResponse.json({ packs, conceptCount, layerCount, dictCount });
}
