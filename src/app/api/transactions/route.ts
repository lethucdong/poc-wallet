import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const transactions = await db.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(transactions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, amount, category, note } = body;

  if (!type || !amount || !category) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const transaction = await db.transaction.create({
    data: {
      type: type === "income" ? "income" : "expense",
      amount: Number(amount),
      category: String(category),
      note: String(note ?? ""),
    },
  });

  return NextResponse.json(transaction, { status: 201 });
}
