import { NextResponse } from "next/server";
import { io } from "next/cache";
import {
  RegistryHttpError,
  checkBadge,
  isAccountBadgeResult,
} from "@/lib/concordium/live";
import { normalizeBadgeVerdict } from "@/lib/concordium/verdict";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await io();
  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { error: "Provide a badge token address or a Concordium account" },
      { status: 400 },
    );
  }

  try {
    const result = await checkBadge(id);
    const payload = isAccountBadgeResult(result)
      ? {
          kind: "account" as const,
          account: result.account,
          agentCount: result.agent_count,
          summary: result.summary,
          agents: result.agents.map((agent) =>
            normalizeBadgeVerdict(agent, result.network),
          ),
        }
      : { kind: "badge" as const, badge: normalizeBadgeVerdict(result) };
    return NextResponse.json(payload);
  } catch (error) {
    const code = error instanceof RegistryHttpError ? error.status : 502;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: code },
    );
  }
}
