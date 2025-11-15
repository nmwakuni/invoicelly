// src/index.ts (or wherever your main app is)
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { createAuth, type Auth, type User, type Session } from './lib/auth'
import { authMiddleware } from './middleware/auth'
import invoicesRouter from './routes/invoices'
import clientsRouter from './routes/clients'
import paymentsRouter from './routes/payments'
import analyticsRouter from './routes/analytics'
import usersRouter from './routes/users'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  ALLOWED_ORIGINS?: string
}

type Variables = {
  auth: Auth
  user?: User
  session?: Session
  userId?: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware
app.use('*', logger())
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS
    ? c.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000']

  return cors({
    origin: allowedOrigins,
    credentials: true,
  })(c, next)
})

// Initialize auth instance for each request
app.use('*', async (c, next) => {
  const auth = createAuth(c.env)
  c.set('auth', auth)
  await next()
})

// ============================================
// BETTER AUTH ROUTES (NO AUTH REQUIRED)
// ============================================
app.on(['POST', 'GET'], '/api/auth/**', async (c) => {
  const auth = c.get('auth')
  return auth.handler(c.req.raw)
})

// ============================================
// PROTECTED API ROUTES (AUTH REQUIRED)
// ============================================
app.use('/api/*', authMiddleware)
app.route('/api/invoices', invoicesRouter)
app.route('/api/clients', clientsRouter)
app.route('/api/payments', paymentsRouter)
app.route('/api/analytics', analyticsRouter)
app.route('/api/users', usersRouter)

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: Date.now() })
})

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
