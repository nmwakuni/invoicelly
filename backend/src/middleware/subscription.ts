// src/middleware/subscription.ts
import { Context, Next } from 'hono'
import { PLAN_LIMITS } from '../types'

type PlanType = 'free' | 'starter' | 'pro' | 'business'

interface UserSubscription {
  subscription_id?: string
  plan: PlanType
  status: string
}

interface CountResult {
  count: number
}

export function checkSubscription(feature: 'invoices' | 'clients' | 'features') {
  return async (c: Context, next: Next) => {
    const userId = c.get('user')?.id
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Get user's subscription
    const user = await c.env.DB.prepare(`
      SELECT u.subscription_id, s.plan, s.status
      FROM users u
      LEFT JOIN subscriptions s ON u.subscription_id = s.id
      WHERE u.id = ?
    `).bind(userId).first() as UserSubscription | null

    const plan = (user?.plan || 'free') as PlanType
    const status = user?.status || 'active'

    if (status !== 'active' && plan !== 'free') {
      return c.json({ 
        error: 'Subscription inactive',
        message: 'Please update your subscription to continue'
      }, 402)
    }

    // Check feature limits
    if (feature === 'invoices') {
      const limits = PLAN_LIMITS[plan]
      
      if (limits.invoicesPerMonth !== -1) {
        // Check invoice count this month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const count = await c.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM invoices
          WHERE user_id = ? 
          AND created_at >= ?
        `).bind(userId, Math.floor(startOfMonth.getTime() / 1000)).first() as CountResult | null

        if (count && count.count >= limits.invoicesPerMonth) {
          return c.json({
            error: 'Invoice limit reached',
            message: `You've reached your limit of ${limits.invoicesPerMonth} invoices per month. Please upgrade your plan.`,
            upgrade: true
          }, 402)
        }
      }
    }

    if (feature === 'clients') {
      const limits = PLAN_LIMITS[plan]
      
      if (limits.clients !== -1) {
        const count = await c.env.DB.prepare(`
          SELECT COUNT(*) as count
          FROM clients
          WHERE user_id = ?
        `).bind(userId).first() as CountResult | null

        if (count && count.count >= limits.clients) {
          return c.json({
            error: 'Client limit reached',
            message: `You've reached your limit of ${limits.clients} clients. Please upgrade your plan.`,
            upgrade: true
          }, 402)
        }
      }
    }

    // Store plan info in context for use in route
    c.set('plan', plan)
    c.set('planLimits', PLAN_LIMITS[plan])

    await next()
  }
}

// Check if user has specific feature
export function requireFeature(featureName: string) {
  return async (c: Context, next: Next) => {
    const userId = c.get('user')?.id
    
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const user = await c.env.DB.prepare(`
      SELECT u.subscription_id, s.plan
      FROM users u
      LEFT JOIN subscriptions s ON u.subscription_id = s.id
      WHERE u.id = ?
    `).bind(userId).first() as UserSubscription | null

    const plan = (user?.plan || 'free') as PlanType
    const limits = PLAN_LIMITS[plan]
    const features = limits.features

    // Check if feature is available (handle readonly array)
    const hasFeature = features.some(f => f === featureName || f === 'everything')

    if (!hasFeature) {
      return c.json({
        error: 'Feature not available',
        message: `The '${featureName}' feature is not available on your current plan.`,
        upgrade: true
      }, 402)
    }

    await next()
  }
}
