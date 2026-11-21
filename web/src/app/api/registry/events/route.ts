import { NextRequest, NextResponse } from "next/server";
import { io } from "next/cache";
import { RegistryHttpError, recentEvents } from "@/lib/concordium/live";

export async function GET(request: NextRequest) {
  await io();
  const { searchParams } = request.nextUrl;
  const raw = Number.parseInt(searchParams.get("limit") ?? "6", 10);
  const limit = Number.isNaN(raw) ? 6 : Math.min(Math.max(raw, 1), 20);

  try {
    return NextResponse.json(await recentEvents(limit));
  } catch (error) {
    const code = error instanceof RegistryHttpError ? error.status : 502;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: code },
    );
  }
}
