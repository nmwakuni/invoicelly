# Invoice Generator

A modern, full-stack invoice management system built with Next.js, Hono, and Cloudflare Workers.

## 🚀 Features

- ✅ **Complete Invoice Management** - Create, send, and track invoices
- ✅ **Client Management** - Organize and manage clients
- ✅ **PDF Generation** - Beautiful, professional invoice PDFs
- ✅ **Email Notifications** - Automated invoice delivery
- ✅ **Payment Tracking** - Record and monitor payments
- ✅ **Recurring Invoices** - Automated recurring billing
- ✅ **Subscription Management** - Paddle & PayPal integration
- ✅ **Analytics Dashboard** - Revenue and performance insights
- ✅ **Multi-currency Support** - Invoice in any currency
- ✅ **Rate Limiting** - Built-in API protection
- ✅ **Authentication** - Secure JWT-based auth

## 📁 Project Structure
```
invoice-generator/
├── backend/        # Hono + Cloudflare Workers API
│   ├── src/        # Source code
│   ├── tests/      # Test files
│   └── schema.sql  # Database schema
│
└── frontend/       # Next.js application
    ├── app/        # App router pages
    ├── components/ # React components
    └── lib/        # Utilities and hooks
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Payments**: Paddle, PayPal
- **Email**: Resend
- **Rate Limiting**: Arcjet

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for deployment)

### Installation

1. **Clone the repository**
```bash
git clone <your-repo>
cd invoice-generator
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
```

4. **Set up environment variables**

Backend (`backend/.dev.vars`):
```bash
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your credentials
```

Frontend (`frontend/.env.local`):
```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

5. **Create Cloudflare D1 database**
```bash
cd backend
npx wrangler d1 create invoice-generator
# Copy the database_id and update wrangler.toml
```

6. **Run database migrations**
```bash
npx wrangler d1 execute invoice-generator --local --file=schema.sql
```

7. **Start development servers**

Backend:
```bash
cd backend
npm run dev
# Backend runs on http://localhost:8787
```

Frontend (in new terminal):
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

## 📚 Documentation

- [Backend API Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Database Schema](./backend/schema.sql)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Backend (Cloudflare Workers)
```bash
cd backend
npm run deploy
```

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

Or connect your GitHub repo to Vercel for automatic deployments.

## 🔐 Environment Variables

### Backend (.dev.vars)
```
PADDLE_VENDOR_ID=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
RESEND_API_KEY=
ARCJET_KEY=
JWT_SECRET=
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=
```

## 📊 Features Breakdown

### Invoice Management
- Create drafts
- Send via email with PDF attachment
- Track status (draft, sent, paid, overdue)
- Multi-currency support
- Tax and discount calculations
- Payment tracking

### Client Management
- Full contact information
- Address management
- Activity history
- Invoice statistics

### Subscriptions
- Free, Starter, Pro, Business tiers
- Paddle and PayPal integration
- Automatic limit enforcement
- Usage tracking

### Analytics
- Revenue tracking
- Invoice status breakdown
- Top clients
- Revenue over time charts

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- shadcn/ui for beautiful components
- Cloudflare for Workers and D1
- All open source contributors

## 📧 Support

For support, email support@yourdomain.com or open an issue on GitHub.

---

Built with ❤️ using Next.js and Cloudflare Workers
