import { NextRequest, NextResponse } from "next/server";
import { io } from "next/cache";
import { evaluateTrustGate } from "@/lib/concordium/verification";

/**
 * The hiring / payment verification gate.
 *
 * GET /api/verification/gate?token=<badge token address>
 * GET /api/verification/gate?owner=<account>&tokenId=<agent number>
 *
 * Returns the live verdict plus an explicit allow/block decision. The
 * gate fails closed: if the registry cannot be reached, `decision` is
 * `block` with `verificationPerformed: false`.
 */
export async function GET(request: NextRequest) {
  await io();
  const { searchParams } = request.nextUrl;
  const tokenAddress = searchParams.get("token")?.trim() || undefined;
  const ownerAccount = searchParams.get("owner")?.trim() || undefined;
  const rawTokenId = searchParams.get("tokenId");
  const tokenId = rawTokenId != null ? Number.parseInt(rawTokenId, 10) : undefined;

  const hasTokenId = tokenId != null && Number.isFinite(tokenId);
  if (!tokenAddress && !(ownerAccount && hasTokenId)) {
    return NextResponse.json(
      {
        error:
          "Provide either ?token=<badge token address> or ?owner=<account>&tokenId=<agent number>",
      },
      { status: 400 },
    );
  }

  const result = await evaluateTrustGate({
    tokenAddress,
    ownerAccount,
    tokenId: hasTokenId ? tokenId : undefined,
  });

  return NextResponse.json(result, {
    headers: { "cache-control": "no-store" },
  });
}
