import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const layers = await prisma.layerDefinition.findMany({
    orderBy: { index: "asc" },
  });
  return NextResponse.json(layers);
}
