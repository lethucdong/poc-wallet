import { callLLM } from "@/llm/mockProvider";
import { getCategories, ensureCategory } from "@/skills/createCategory";

export type ParsedTransaction = {
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string;
  transactionDate: Date;
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseDate(value: unknown): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date();
  }
  const d = new Date(`${value}T00:00:00`);
  return isNaN(d.getTime()) ? new Date() : d;
}

export async function parseTransaction(
  input: string
): Promise<ParsedTransaction> {
  const categoryList = await getCategories();

  const systemPrompt = `
You are a Vietnamese personal finance assistant. Today is ${todayISO()}.
Parse the user input into a JSON transaction with these fields:
- type: "income" or "expense"
- amount: number in VND (integer, no commas or currency symbols)
- category: choose the best fit from this list: ${categoryList.join(", ")}. If nothing fits, invent a short lowercase English word.
- date: ISO date string YYYY-MM-DD inferred from the input. Examples: "hôm nay" → today, "hôm qua" → yesterday, "tuần trước" → 7 days ago. Use today if no date is mentioned.
- note: repeat the original user input unchanged

Return only valid JSON, no explanation.
`.trim();

  const response = await callLLM(systemPrompt, [
    { role: "user", content: input },
  ]);

  const data = JSON.parse(response.content);

  const categoryResult = await ensureCategory(String(data.category || "other"));
  const category = categoryResult.ok ? categoryResult.name : "other";

  return {
    type: data.type === "income" ? "income" : "expense",
    amount: Number(data.amount) || 0,
    category,
    note: String(data.note || input),
    transactionDate: parseDate(data.date),
  };
}
