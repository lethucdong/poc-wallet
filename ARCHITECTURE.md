# Kiến trúc & Flow hoạt động — PoC Wallet

## Tổng quan

```
Browser (React)
  ↕  fetch()
Next.js API Routes
  ↕  Prisma ORM
SQLite (dev.db)
```

---

## Cấu trúc thư mục & vai trò

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Dashboard — UI duy nhất
│   └── api/
│       ├── transactions/
│       │   └── route.ts        # GET + POST /api/transactions
│       └── ai-parse/
│           └── route.ts        # POST /api/ai-parse
│
├── components/
│   ├── TransactionForm.tsx     # Form nhập (2 tab: AI / thủ công)
│   └── TransactionList.tsx     # Hiển thị danh sách giao dịch
│
├── lib/
│   └── db.ts                   # Prisma client singleton — 1 kết nối duy nhất
│
├── skills/                     # Mỗi skill = 1 khả năng cụ thể
│   └── parseTransaction.ts     # Skill: gọi LLM, parse JSON → object
│
├── agents/                     # Agent = orchestrator gọi nhiều skill
│   └── financeAgent.ts         # Validate input, gọi skill, trả kết quả
│
└── llm/
    └── mockProvider.ts         # LLM provider — hiện là mock, swap được
```

---

## Flow 1: Thêm giao dịch thủ công

```
User điền form (tab "Thủ công")
  → click "Thêm giao dịch"
  → TransactionForm.tsx: fetch POST /api/transactions
      body: { type, amount, category, note }
  → src/app/api/transactions/route.ts
      validate fields
      db.transaction.create({ data })    ← Prisma ghi vào SQLite
  → trả { id, type, amount, category, note, createdAt }
  → TransactionForm gọi onAdded()
  → Dashboard re-fetch GET /api/transactions
  → TransactionList re-render
```

---

## Flow 2: AI Input ("ăn sáng 35k")

```
User gõ text (tab "AI Input")
  → click "Thêm" hoặc Enter
  → TransactionForm.tsx: fetch POST /api/ai-parse
      body: { input: "ăn sáng 35k" }
  → src/app/api/ai-parse/route.ts
      gọi financeAgent(input)

        financeAgent.ts
          validate: input không rỗng
          gọi parseTransaction(input)

            parseTransaction.ts (skill)
              chuẩn bị systemPrompt (hướng dẫn cho LLM)
              gọi callLLM(systemPrompt, messages)

                mockProvider.ts (LLM layer)
                  phân tích text:
                    - tìm số + đơn vị (k, triệu)
                    - xác định income/expense
                    - map category
                  trả JSON string

              JSON.parse(response.content)
              trả ParsedTransaction object

          validate: amount > 0
          trả { ok: true, data }

      db.transaction.create({ data: result.data })
  → trả transaction đã lưu
  → UI cập nhật
```

---

## Flow 3: Load Dashboard

```
Browser mở http://localhost:3000
  → src/app/page.tsx render (client component)
  → useEffect: fetch GET /api/transactions
  → src/app/api/transactions/route.ts
      db.transaction.findMany({ orderBy: createdAt desc, take: 100 })
  → trả mảng transactions
  → Dashboard tính tổng thu / chi / số dư
  → TransactionList render danh sách
```

---

## Cách các lớp giao tiếp

```
┌─────────────────────────────────────────────────────┐
│  UI Layer (React Components)                        │
│  page.tsx → TransactionForm, TransactionList        │
│  Chỉ biết: fetch API, hiển thị data                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP fetch()
┌──────────────────────▼──────────────────────────────┐
│  API Layer (Next.js Route Handlers)                 │
│  /api/transactions, /api/ai-parse                   │
│  Biết: validate, gọi agent, gọi db                 │
└──────────────┬────────────────┬────────────────────-┘
               │                │
┌──────────────▼──────┐  ┌──────▼──────────────────────┐
│  DB Layer           │  │  AI Layer                    │
│  lib/db.ts          │  │  agents/ → skills/ → llm/    │
│  Prisma + SQLite    │  │  financeAgent → parseTransaction → mockProvider │
└─────────────────────┘  └──────────────────────────────┘
```

---

## lib/db.ts — Tại sao dùng singleton?

Next.js dev mode reload module liên tục → nếu `new PrismaClient()` mỗi lần
sẽ tạo hàng trăm kết nối. Singleton đảm bảo chỉ có 1 instance.

```ts
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Prisma v7 + better-sqlite3:** Prisma 7 bỏ binary engine, cần driver adapter.
`PrismaBetterSqlite3` là bridge giữa Prisma và SQLite driver.

---

## llm/mockProvider.ts — Tại sao tách riêng?

```
mockProvider.ts  →  thay bằng  →  openaiProvider.ts
                                    geminiProvider.ts
                                    claudeProvider.ts
```

Phần còn lại (agent, skill, API) không đổi gì cả.
Chỉ cần hàm `callLLM(systemPrompt, messages)` trả `{ content: string }`.

**Swap sang OpenAI thật:**
```ts
// src/llm/mockProvider.ts
export async function callLLM(systemPrompt, messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  return { content: data.choices[0].message.content };
}
```

---

## Mở rộng thêm skill mới

Ví dụ thêm skill phân tích báo cáo tháng:

```
1. Tạo src/skills/monthlySummary.ts
   export async function monthlySummary(month: string) { ... }

2. Tạo src/agents/reportAgent.ts
   import { monthlySummary } from "@/skills/monthlySummary";

3. Tạo src/app/api/report/route.ts
   import { reportAgent } from "@/agents/reportAgent";
```

Không cần chạm vào code cũ.

---

## Dữ liệu Transaction

```ts
type Transaction = {
  id:        string    // cuid() — unique ID
  type:      string    // "income" | "expense"
  amount:    number    // VND, không format
  category:  string    // food | drink | transport | salary | bill | shopping | other
  note:      string    // text gốc từ user
  createdAt: Date      // auto
}
```

---

## Lệnh thường dùng

```bash
npm run dev          # Chạy dev server
npm run db:seed      # Seed lại sample data
npm run db:reset     # Reset DB + seed
npx prisma studio    # GUI quản lý DB
```
