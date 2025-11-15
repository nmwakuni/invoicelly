# Invoice Generator Backend

Hono + Cloudflare Workers backend for the Invoice Generator application.

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.dev.vars.example` to `.dev.vars` and fill in your credentials:
```bash
cp .dev.vars.example .dev.vars
```

### 3. Create D1 Database
```bash
npx wrangler d1 create invoice-generator
```

Copy the `database_id` from the output and update `wrangler.toml`.

### 4. Run Migrations
```bash
# Local
npx wrangler d1 execute invoice-generator --local --file=schema.sql

# Production
npx wrangler d1 execute invoice-generator --file=schema.sql
```

### 5. Create R2 Bucket
```bash
npx wrangler r2 bucket create invoice-pdfs
```

## Development
```bash
npm run dev
```

API will be available at `http://localhost:8787`

## Testing
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Deployment
```bash
npm run deploy
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Clients
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client
- `PATCH /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Invoices
- `GET /api/invoices` - List all invoices
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create invoice
- `PATCH /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `POST /api/invoices/:id/send` - Send invoice via email
- `POST /api/invoices/:id/mark-paid` - Mark invoice as paid

### Payments
- `POST /api/payments` - Record payment
- `GET /api/payments/invoice/:id` - Get invoice payments
- `DELETE /api/payments/:id` - Delete payment

### Subscriptions
- `POST /api/subscriptions/checkout` - Create checkout session
- `GET /api/subscriptions/current` - Get current subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/revenue` - Revenue over time

### Webhooks
- `POST /webhooks/paddle` - Paddle webhook
- `POST /webhooks/paypal` - PayPal webhook

## Environment Variables

See `.dev.vars.example` for all required environment variables.

## Architecture
```
src/
├── index.ts           # Main Hono app
├── routes/            # API route handlers
├── services/          # External service integrations
├── middleware/        # Auth, rate limiting, etc.
├── utils/             # Validation, helpers
└── types/             # TypeScript types
```

## Rate Limits

- Free tier: 100 requests/hour
- Starter: 1,000 requests/hour
- Pro: 10,000 requests/hour
- Business: Unlimited

## Database Schema

See `schema.sql` for complete database structure.

## Support

For issues or questions, please open an issue on GitHub.
