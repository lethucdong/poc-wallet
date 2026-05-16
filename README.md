# PoC Wallet — Quản lý thu chi cá nhân

Next.js App Router + TypeScript + TailwindCSS + Prisma + SQLite


Lưu ý: Sau khi người khác clone repo, cần chạy:
  ▎ npm install
  ▎ npx prisma generate
  ▎ npx prisma migrate dev
  ▎ npm run db:seed

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| Backend | Next.js Route Handlers |
| ORM | Prisma 7 (prisma-client-js) |
| Database | SQLite via better-sqlite3 |
| AI (mock) | Mock LLM provider |

## Cài đặt

```bash
npm install
npm run dev
```

Database đã được migrate và seed sẵn. Nếu muốn reset:

```bash
npm run db:reset
```

## API

```
GET  /api/transactions        # Lấy danh sách giao dịch (100 gần nhất)
POST /api/transactions        # Tạo giao dịch thủ công
POST /api/ai-parse            # AI parse text → tạo giao dịch
```

### POST /api/transactions

```json
{ "type": "expense", "amount": 35000, "category": "food", "note": "ăn phở" }
```

### POST /api/ai-parse

```json
{ "input": "ăn sáng 35k" }
{ "input": "cafe 25k" }
{ "input": "lương 15 triệu" }
```

## Cấu trúc

```
src/
  app/
    page.tsx                  Dashboard
    layout.tsx
    globals.css
    api/
      transactions/route.ts   GET + POST
      ai-parse/route.ts       AI input → transaction
  components/
    TransactionForm.tsx       Form thêm (AI + thủ công)
    TransactionList.tsx       Danh sách giao dịch
  lib/
    db.ts                     Prisma client singleton
  skills/
    parseTransaction.ts       Parse AI input → transaction object
  agents/
    financeAgent.ts           Finance agent
  llm/
    mockProvider.ts           Mock LLM (swap để dùng OpenAI thật)

prisma/
  schema.prisma               Prisma schema
  seed.ts                     Sample data
  dev.db                      ← auto-generated
```

## AI Flow

```
User Input ("ăn sáng 35k")
  → POST /api/ai-parse
  → financeAgent.ts           validate input
  → parseTransaction.ts       call LLM skill
  → mockProvider.ts           mock LLM response
  → { type, amount, category, note }
  → db.transaction.create()
  → Transaction JSON
```

## Swap Mock LLM với OpenAI

Chỉnh `src/llm/mockProvider.ts`:

```ts
export async function callLLM(systemPrompt, messages) {
  const openai = new OpenAI();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    response_format: { type: "json_object" },
  });
  return { content: res.choices[0].message.content };
}
```

## Transaction Schema

```
id        String   cuid
type      String   "income" | "expense"
amount    Float    VND
category  String   food | drink | transport | salary | bill | shopping | other
note      String
createdAt DateTime
```
