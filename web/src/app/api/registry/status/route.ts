import { NextResponse } from "next/server";
import { io } from "next/cache";
import { registryStatus, RegistryHttpError } from "@/lib/concordium/live";

export async function GET() {
  await io();
  try {
    return NextResponse.json(await registryStatus());
  } catch (error) {
    const status =
      error instanceof RegistryHttpError ? error.status : 502;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status },
    );
  }
}
