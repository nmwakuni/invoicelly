invoice-generator/
├── backend/                          # Hono + Cloudflare Workers
│   ├── src/
│   │   ├── index.ts
│   │   ├── db/
│   │   │   └── schema.ts
│   │   ├── routes/
│   │   │   ├── clients.ts
│   │   │   ├── invoices.ts
│   │   │   ├── payments.ts
│   │   │   ├── subscriptions.ts
│   │   │   ├── webhooks.ts
│   │   │   └── analytics.ts
│   │   ├── services/
│   │   │   ├── paddle.ts
│   │   │   ├── paypal.ts
│   │   │   ├── pdf.ts
│   │   │   └── email.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── subscription.ts
│   │   │   └── rate-limit.ts
│   │   ├── utils/
│   │   │   └── validation.ts
│   │   └── types/
│   │       └── index.ts
│   ├── tests/
│   ├── wrangler.toml
│   ├── package.json
│   ├── tsconfig.json
│   └── schema.sql
│
├── frontend/                         # Next.js
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── invoices/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   ├── page.tsx
│   │   │   │   └── billing/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── layout/
│   │   ├── clients/
│   │   ├── invoices/
│   │   ├── analytics/
│   │   └── shared/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── utils.ts
│   │   ├── hooks/
│   │   └── types/
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── next.config.js
│
└── README.md
