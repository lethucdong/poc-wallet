import { PrismaClient } from "../src/generated/prisma";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter } as any);

const categoryNames = [
  "food",
  "drink",
  "transport",
  "salary",
  "bill",
  "shopping",
  "other",
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

const seedData = [
  { type: "income", amount: 15_000_000, category: "salary", note: "lương tháng 5", transactionDate: daysAgo(15) },
  { type: "expense", amount: 35_000, category: "food", note: "ăn sáng bún bò", transactionDate: daysAgo(1) },
  { type: "expense", amount: 25_000, category: "drink", note: "cafe sáng", transactionDate: daysAgo(1) },
  { type: "expense", amount: 120_000, category: "food", note: "ăn trưa cùng team", transactionDate: daysAgo(0) },
  { type: "expense", amount: 50_000, category: "transport", note: "grab về nhà", transactionDate: daysAgo(0) },
  { type: "income", amount: 500_000, category: "other", note: "thưởng dự án", transactionDate: daysAgo(3) },
  { type: "expense", amount: 200_000, category: "bill", note: "tiền điện tháng 5", transactionDate: daysAgo(7) },
  { type: "expense", amount: 85_000, category: "shopping", note: "mua đồ văn phòng", transactionDate: daysAgo(2) },
];

async function main() {
  await db.transaction.deleteMany();
  await db.category.deleteMany();

  for (const name of categoryNames) {
    await db.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  await db.transaction.createMany({ data: seedData });
  console.log(`Seeded ${categoryNames.length} categories and ${seedData.length} transactions`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
