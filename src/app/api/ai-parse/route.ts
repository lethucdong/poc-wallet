import { NextRequest, NextResponse } from "next/server";
import { financeAgent } from "@/agents/financeAgent";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { input } = await req.json();

    const result = await financeAgent(input);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    const transaction = await db.transaction.create({ data: result.data });

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai-parse]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
