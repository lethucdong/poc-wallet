"use client";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  category: string;
  note: string;
  transactionDate: string;
  createdAt: string;
};

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍜",
  drink: "☕",
  transport: "🚗",
  salary: "💰",
  bill: "📄",
  shopping: "🛍️",
  other: "📌",
};

function formatVND(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return `${amount}`;
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-center text-gray-400 py-8">Chưa có giao dịch nào.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {transactions.map((t) => (
        <li
          key={t.id}
          className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{CATEGORY_EMOJI[t.category] ?? "📌"}</span>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {t.note || t.category}{" "}
                <span className="font-normal text-gray-400">
                  ({new Date(t.transactionDate).toLocaleDateString("vi-VN")})
                </span>
              </p>
              <p className="text-xs text-gray-400">
                {new Date(t.createdAt).toLocaleDateString("vi-VN")} ·{" "}
                {t.category}
              </p>
            </div>
          </div>
          <span
            className={`font-semibold ${
              t.type === "income" ? "text-green-600" : "text-red-500"
            }`}
          >
            {t.type === "income" ? "+" : "-"}
            {formatVND(t.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
