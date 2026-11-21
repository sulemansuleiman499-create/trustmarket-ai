import { NextResponse } from "next/server";
import { io } from "next/cache";
import { RegistryHttpError, getAgent } from "@/lib/concordium/live";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await io();
  const { id } = await params;
  const tokenId = Number.parseInt(id, 10);
  if (Number.isNaN(tokenId)) {
    return NextResponse.json(
      { error: "Agent ID must be a numeric registry token id" },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await getAgent(tokenId));
  } catch (error) {
    const code = error instanceof RegistryHttpError ? error.status : 502;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: code },
    );
  }
}
