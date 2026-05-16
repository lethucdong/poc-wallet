import { parseTransaction, ParsedTransaction } from "@/skills/parseTransaction";

export type AgentResult =
  | { ok: true; data: ParsedTransaction }
  | { ok: false; error: string };

// Finance agent: receives raw text, returns structured transaction
export async function financeAgent(input: string): Promise<AgentResult> {
  if (!input.trim()) {
    return { ok: false, error: "Input is empty" };
  }

  try {
    const data = await parseTransaction(input);
    if (data.amount <= 0) {
      return { ok: false, error: "Could not detect amount" };
    }
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
