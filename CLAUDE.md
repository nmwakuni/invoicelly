# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Invoice Generator is a full-stack monorepo with separate backend and frontend applications:
- **Backend**: Hono API running on Cloudflare Workers with D1 (SQLite) database and R2 storage
- **Frontend**: Next.js 16 application using App Router, React 19, and Tailwind CSS

## Development Commands

### Backend (from `backend/` directory)
```bash
npm run dev              # Start dev server on http://localhost:8787
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
npm run deploy           # Deploy to Cloudflare Workers
```

### Frontend (from `frontend/` directory)
```bash
npm run dev    # Start dev server on http://localhost:3000
npm run build  # Build for production
npm start      # Start production server
npm run lint   # Run ESLint
```

### Database Operations (from `backend/` directory)
```bash
# Create D1 database (first time setup)
npx wrangler d1 create invoice-generator

# Run migrations locally
npx wrangler d1 execute invoice-generator --local --file=schema.sql

# Run migrations in production
npx wrangler d1 execute invoice-generator --file=schema.sql

# Create R2 bucket for PDFs
npx wrangler r2 bucket create invoice-pdfs
```

## Architecture & Key Patterns

### Backend Architecture

**Entry Point**: `backend/src/index.ts` - Main Hono app with route registration and middleware

**Authentication**: Uses Better Auth (NOT NextAuth) with D1 adapter
- Session-based auth with cookies (no manual JWT handling)
- Auth routes at `/api/auth/**` are public and handled by Better Auth
- All `/api/*` routes require authentication via `authMiddleware`
- User model extends Better Auth with custom fields: `businessName`, `businessAddress`, `taxId`
- Configuration in `backend/src/lib/auth.ts`

**Route Organization**:
- Routes are in `backend/src/routes/` as separate Hono apps
- Each route exports a Hono instance that gets mounted in `index.ts`
- Protected routes use `authMiddleware` which sets `c.get('user')` context

**Database**:
- Cloudflare D1 (SQLite) accessed via Drizzle ORM
- Schema defined in `backend/src/db/schema.ts` and `backend/schema.sql`
- Database binding: `c.env.DB`
- Storage binding: `c.env.BUCKET` (R2 for PDF storage)

**Key Tables**:
- Better Auth tables: `user`, `session`, `account`, `verification`
- App tables: `clients`, `invoices`, `invoice_items`, `payments`
- All app tables have foreign keys to `user(id)` for multi-tenancy

**Middleware**:
- `middleware/auth.ts` - Validates Better Auth session, sets user context
- `middleware/subscription.ts` - Enforces subscription limits (commented: Paddle/PayPal integration)
- `middleware/rate-limit.ts` - API rate limiting (commented: Arcjet integration)

**Services**:
- `services/pdf.ts` - PDF generation for invoices
- `services/email.ts` - Email sending via Resend
- `services/storage.ts` - R2 file operations
- `services/paddle.ts`, `services/paypal.ts` - Payment integrations

### Frontend Architecture

**App Router Structure**: Uses Next.js App Router with route groups
- `(auth)/` - Unauthenticated routes: login, register
- `(dashboard)/` - Protected dashboard routes: invoices, clients, analytics, settings
- Each route group has its own `layout.tsx`

**State Management**:
- TanStack Query (React Query) for server state
- API client in `lib/api.ts` using axios with Better Auth cookie credentials
- No manual token management - Better Auth handles auth via cookies

**API Integration**:
- Base API client configured with `withCredentials: true` for Better Auth
- Automatic redirect to `/login` on 401 responses
- Pre-configured API helpers: `invoicesApi`, `clientsApi`, `paymentsApi`, `analyticsApi`

**UI Components**:
- shadcn/ui components in `components/ui/`
- Feature-specific components organized by domain: `components/clients/`, `components/invoices/`, etc.
- Layout components in `components/layout/`

**Forms**: React Hook Form + Zod for validation

**Styling**: Tailwind CSS v4 with custom theme configuration

## Important Implementation Details

### Authentication Flow
1. Frontend calls Better Auth endpoints via `/api/auth/**` (handled by backend)
2. Backend Better Auth sets HTTP-only cookies
3. Frontend makes authenticated requests with `withCredentials: true`
4. Backend `authMiddleware` validates session and provides user context
5. **Never manually handle JWT tokens or auth headers** - Better Auth manages this

### Database Queries
- Always filter by `user_id` to enforce multi-tenancy
- Use Drizzle ORM, not raw SQL queries when possible
- Schema types exported from `backend/src/db/schema.ts`

### Invoice Workflow
1. Create invoice (status: 'draft')
2. Generate PDF via `services/pdf.ts`
3. Upload to R2 via `services/storage.ts`
4. Send email with PDF attachment via `services/email.ts`
5. Update status to 'sent'
6. Mark as 'paid' when payment recorded

### Testing
- Backend tests use Vitest with Cloudflare Workers pool
- Test structure: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Mock D1 and R2 bindings in tests

### Environment Variables

**Backend** (`.dev.vars`):
- `RESEND_API_KEY` - Resend API key for email sending
- `R2_PUBLIC_DOMAIN` - Public domain for R2 bucket (e.g., https://your-r2-domain.com)
- `EMAIL_FROM_DOMAIN` - Domain for sending emails (e.g., yourdomain.com)
- Better Auth credentials (Google, GitHub OAuth - optional):
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
- Paddle/PayPal credentials (subscription features - optional)
- Arcjet key (rate limiting - optional)

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API URL (http://localhost:8787 for dev)
- `NEXT_PUBLIC_APP_URL` - Frontend URL (http://localhost:3000 for dev)

## Common Development Tasks

### Adding a New Route
1. Create route handler in `backend/src/routes/[name].ts`
2. Export Hono instance with routes
3. Register in `backend/src/index.ts` with `app.route()`
4. Add corresponding API helper in `frontend/lib/api.ts`

### Adding a Database Table
1. Update `backend/schema.sql` with new table
2. Run migration: `npx wrangler d1 execute invoice-generator --local --file=schema.sql`
3. Update Drizzle schema in `backend/src/db/schema.ts`
4. Add foreign key to `user(id)` for user-scoped data

### Testing a Single Test File
```bash
cd backend
npx vitest run tests/unit/[filename].test.ts
```

## Critical Security Fixes Applied

The following security and correctness fixes have been implemented:

1. **SQL Injection Prevention**: Client update route uses whitelisted fields
2. **Atomic Invoice Numbers**: Invoice number generation uses database batch for atomicity
3. **Error Handling**: PDF generation wrapped in try-catch with proper error responses
4. **Environment Variables**: Hardcoded domains replaced with configurable env vars
5. **Schema Consistency**: Database schema updated to match code expectations (payment_records table, missing columns added)

## Deployment

**Backend**: Deploys to Cloudflare Workers
- Update `wrangler.toml` with correct `database_id` from D1 creation
- Run migrations on production database before deploying
- Use `npm run deploy` from backend directory

**Frontend**: Designed for Vercel deployment
- Set environment variables in Vercel dashboard
- Connect GitHub repo for automatic deployments
