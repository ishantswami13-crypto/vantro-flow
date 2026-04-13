# Vantro Flow

AI collections OS for Indian MSMEs — distributors, traders, and dealers who manage receivables across dozens of customers.

## What it does

- **Dashboard** — outstanding balances, aging breakdown, follow-up list, cash flow forecast
- **Customer pages** — per-customer invoice history, communication timeline, promise tracker
- **AI reminders** — one-click Hinglish WhatsApp message generation via Groq
- **Promise tracker** — log payment promises, mark received or broken
- **Analytics** — aging bucket charts, top customers by outstanding, monthly collection trend
- **Quick Add** — add invoices manually without a CSV
- **CSV upload** — bulk import invoices

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- Neon PostgreSQL + Drizzle ORM
- Groq API (llama-3.1-8b-instant) for Hinglish reminder generation

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd vantro-flow
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — Neon PostgreSQL pooled connection string (`?sslmode=require`)
- `GROQ_API_KEY` — from [console.groq.com/keys](https://console.groq.com/keys)

### 3. Run database migrations

```bash
npx tsx src/db/migrate.ts
```

### 4. Seed initial data (optional)

Creates a demo organisation (org id=1):

```bash
npx tsx src/db/seed.ts
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Add environment variables (`DATABASE_URL`, `GROQ_API_KEY`) in Vercel project settings
4. Deploy

The app runs entirely on serverless functions — no persistent server needed.

## CSV format

Upload invoices at `/upload`. Expected columns:

| Column | Required | Example |
|---|---|---|
| customer_name | yes | Ramesh Traders |
| phone | yes | 9876543210 |
| invoice_number | yes | INV-001 |
| invoice_date | no | 2024-01-15 |
| due_date | no | 2024-02-15 |
| amount | yes | 25000 |
