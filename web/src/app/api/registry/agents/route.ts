import { NextRequest, NextResponse } from "next/server";
import { io } from "next/cache";
import { RegistryHttpError, listAgents } from "@/lib/concordium/live";

export async function GET(request: NextRequest) {
  await io();
  const { searchParams } = request.nextUrl;
  const limit = clampInt(searchParams.get("limit"), 1, 50, 10);
  const offset = clampInt(searchParams.get("offset"), 0, 1_000_000, 0);
  const owner = searchParams.get("owner") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  try {
    const list = await listAgents({ limit, offset, owner, status });
    return NextResponse.json(list);
  } catch (error) {
    const code = error instanceof RegistryHttpError ? error.status : 502;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: code },
    );
  }
}

function clampInt(raw: string | null, min: number, max: number, fallback: number) {
  const n = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}
