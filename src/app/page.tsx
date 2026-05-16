"use client";

import { useEffect, useState, useCallback } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  category: string;
  note: string;
  transactionDate: string;
  createdAt: string;
};

function formatVND(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return `${amount}`;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    const res = await fetch("/api/transactions");
    const data = await res.json();
    setTransactions(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Quản lý thu chi</h1>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white p-3 shadow-sm text-center">
          <p className="text-xs text-gray-400">Thu</p>
          <p className="font-semibold text-green-600">{formatVND(totalIncome)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm text-center">
          <p className="text-xs text-gray-400">Chi</p>
          <p className="font-semibold text-red-500">{formatVND(totalExpense)}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm text-center">
          <p className="text-xs text-gray-400">Số dư</p>
          <p className={`font-semibold ${balance >= 0 ? "text-indigo-600" : "text-red-500"}`}>
            {formatVND(balance)}
          </p>
        </div>
      </div>

      <TransactionForm onAdded={fetchTransactions} />

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-gray-500">Giao dịch gần đây</h2>
        {loading ? (
          <p className="text-center text-gray-400 py-4">Đang tải...</p>
        ) : (
          <TransactionList transactions={transactions} />
        )}
      </div>
    </main>
  );
}
