src/
├── index.ts                      # Main Hono app (entry point)
├── types/
│   ├── index.ts                  # Shared types
│   ├── invoice.ts                # Invoice types
│   ├── client.ts                 # Client types
│   └── subscription.ts           # Subscription types
├── db/
│   ├── schema.ts                 # Drizzle schema (all tables)
│   └── migrations/               # SQL migrations
├── routes/
│   ├── auth.ts                   # Authentication routes
│   ├── users.ts                  # User profile routes
│   ├── clients.ts                # Client CRUD
│   ├── invoices.ts               # Invoice CRUD
│   ├── payments.ts               # Payment tracking
│   ├── subscriptions.ts          # Subscription management (already provided)
│   ├── webhooks.ts               # Payment webhooks (already provided)
│   └── analytics.ts              # Dashboard analytics
├── services/
│   ├── paddle.ts                 # Paddle integration (already provided)
│   ├── paypal.ts                 # PayPal integration (already provided)
│   ├── pdf.ts                    # PDF generation
│   ├── email.ts                  # Email sending (Resend)
│   └── storage.ts                # File storage (R2)
├── middleware/
│   ├── auth.ts                   # Auth middleware
│   ├── subscription.ts           # Subscription check middleware
│   ├── rate-limit.ts             # Arcjet rate limiting
│   └── error.ts                  # Error handling
└── utils/
    ├── validation.ts             # Zod schemas
    ├── helpers.ts                # Utility functions
    └── constants.ts              # App constants

    backend/
├── src/
│   ├── index.ts                 ✅
│   ├── db/
│   │   └── schema.ts            ✅
│   ├── routes/
│   │   ├── clients.ts           ✅
│   │   ├── invoices.ts          ✅
│   │   ├── payments.ts          ✅
│   │   ├── subscriptions.ts     ✅
│   │   ├── webhooks.ts          ✅
│   │   └── analytics.ts         ✅
│   ├── services/
│   │   ├── paddle.ts            ✅
│   │   ├── paypal.ts            ✅
│   │   ├── pdf.ts               ✅
│   │   └── email.ts             ✅
│   ├── middleware/
│   │   ├── auth.ts              ✅
│   │   ├── subscription.ts      ✅
│   │   └── rate-limit.ts        ✅
│   ├── utils/
│   │   └── validation.ts        ✅
│   └── types/
│       └── index.ts             ✅
├── wrangler.toml
├── package.json
└── tsconfig.json
