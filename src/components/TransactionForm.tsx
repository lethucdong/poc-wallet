"use client";

import { useState } from "react";

type Props = { onAdded: () => void };

const CATEGORIES = ["food", "drink", "transport", "salary", "bill", "shopping", "other"];

export function TransactionForm({ onAdded }: Props) {
  const [tab, setTab] = useState<"manual" | "ai">("ai");
  const [aiInput, setAiInput] = useState("");
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "food",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitAI() {
    if (!aiInput.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/ai-parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: aiInput }),
    });
    setLoading(false);
    if (res.ok) {
      setAiInput("");
      onAdded();
    } else {
      const d = await res.json();
      setError(d.error ?? "Lỗi không xác định");
    }
  }

  async function submitManual() {
    if (!form.amount) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    setLoading(false);
    if (res.ok) {
      setForm({ type: "expense", amount: "", category: "food", note: "" });
      onAdded();
    } else {
      setError("Lỗi khi lưu giao dịch");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm space-y-3">
      <div className="flex gap-2">
        {(["ai", "manual"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
              tab === t ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"
            }`}
          >
            {t === "ai" ? "✨ AI Input" : "✏️ Thủ công"}
          </button>
        ))}
      </div>

      {tab === "ai" ? (
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            placeholder='Ví dụ: "ăn sáng 35k", "lương 5 triệu"'
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAI()}
          />
          <button
            onClick={submitAI}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 text-sm text-white disabled:opacity-50"
          >
            {loading ? "..." : "Thêm"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="expense">Chi tiêu</option>
              <option value="income">Thu nhập</option>
            </select>
            <select
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <input
            type="number"
            placeholder="Số tiền (VND)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
          <input
            placeholder="Ghi chú (tuỳ chọn)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <button
            onClick={submitManual}
            disabled={loading || !form.amount}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm text-white disabled:opacity-50"
          >
            {loading ? "Đang lưu..." : "Thêm giao dịch"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
