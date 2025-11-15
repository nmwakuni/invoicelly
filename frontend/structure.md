app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── clients/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── invoices/
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── payments/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   └── layout.tsx
├── api/
│   └── [...].ts          # API route handlers if needed
├── pricing/
│   └── page.tsx
└── layout.tsx            # Root layout

components/
├── ui/                   # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── card.tsx
│   └── ...
├── layout/
│   ├── navbar.tsx
│   ├── sidebar.tsx
│   └── footer.tsx
├── clients/
│   ├── client-list.tsx
│   ├── client-form.tsx
│   └── client-card.tsx
├── invoices/
│   ├── invoice-list.tsx
│   ├── invoice-form.tsx
│   ├── invoice-preview.tsx
│   └── invoice-pdf.tsx
├── analytics/
│   ├── revenue-chart.tsx
│   ├── stats-card.tsx
│   └── top-clients.tsx
└── shared/
    ├── loading-spinner.tsx
    ├── error-boundary.tsx
    └── empty-state.tsx

lib/
├── api.ts               # API client
├── auth.ts              # Auth configuration
├── utils.ts             # Utility functions
├── hooks/
│   ├── use-clients.ts
│   ├── use-invoices.ts
│   └── use-subscription.ts
└── types/
    └── index.ts         # TypeScript types

public/
├── logo.svg
└── images/
