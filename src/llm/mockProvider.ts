export type LLMMessage = { role: "user" | "assistant"; content: string };

export type LLMResponse = { content: string };

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

// Strip markdown code fences if model wraps JSON in ```json ... ```
function extractJSON(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1].trim() : raw.trim();
}

export async function callLLM(
  systemPrompt: string,
  messages: LLMMessage[]
): Promise<LLMResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

  const model = process.env.OPENROUTER_MODEL ?? "google/gemini-flash-1.5";

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${body}`);
  }

  const json = await res.json();
  const raw: string = json.choices?.[0]?.message?.content;
  if (!raw) throw new Error("Empty response from OpenRouter");

  return { content: extractJSON(raw) };
}
