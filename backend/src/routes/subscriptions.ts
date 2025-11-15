// src/routes/subscriptions.ts
import { Hono } from 'hono'
import { PaddleService } from '../services/paddle'
import { PayPalService } from '../services/paypal'
import { z } from 'zod'

interface User {
  id: string
  email: string
  name?: string
}

interface Subscription {
  id: string
  user_id: string
  provider: string
  provider_subscription_id: string
  provider_customer_id: string
  plan: string
  status: string
  cancel_at_period_end: number
  created_at: number
  updated_at: number
}

type Bindings = {
  DB: D1Database
  PADDLE_VENDOR_ID: string
  PADDLE_API_KEY: string
  PADDLE_ENVIRONMENT: string
  PAYPAL_CLIENT_ID: string
  PAYPAL_CLIENT_SECRET: string
  PAYPAL_MODE: string
  APP_URL: string
  // Dynamic plan price IDs
  [key: string]: string | D1Database
}

type Variables = {
  user: User
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Schema for checkout request
const CheckoutSchema = z.object({
  plan: z.enum(['starter', 'pro', 'business']),
  provider: z.enum(['paddle', 'paypal']),
  billingCycle: z.enum(['monthly', 'annual']).default('monthly')
})

// Create checkout session
app.post('/checkout', async (c) => {
  const user = c.get('user')
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json()
  const validation = CheckoutSchema.safeParse(body)
  
  if (!validation.success) {
    return c.json({ error: 'Invalid request', details: validation.error }, 400)
  }

  const { plan, provider, billingCycle } = validation.data

  try {
    if (provider === 'paddle') {
      const paddle = new PaddleService({
        vendorId: c.env.PADDLE_VENDOR_ID,
        apiKey: c.env.PADDLE_API_KEY,
        environment: c.env.PADDLE_ENVIRONMENT as 'sandbox' | 'production'
      })

      // Get price ID based on plan and billing cycle
      const priceIdKey = `PADDLE_PLAN_${plan.toUpperCase()}_${billingCycle.toUpperCase()}`
      const priceId = c.env[priceIdKey] as string

      const userRecord = await c.env.DB.prepare(
        'SELECT email FROM users WHERE id = ?'
      ).bind(user.id).first() as { email: string } | null

      if (!userRecord) {
        return c.json({ error: 'User not found' }, 404)
      }

      const checkoutUrl = await paddle.createCheckoutUrl({
        priceId,
        customerEmail: userRecord.email,
        successUrl: `${c.env.APP_URL}/subscription/success?session_id={checkout_id}`,
        metadata: {
          userId: user.id,
          plan,
          billingCycle
        }
      })

      return c.json({ 
        provider: 'paddle',
        checkoutUrl 
      })

    } else if (provider === 'paypal') {
      const paypal = new PayPalService({
        clientId: c.env.PAYPAL_CLIENT_ID,
        clientSecret: c.env.PAYPAL_CLIENT_SECRET,
        mode: c.env.PAYPAL_MODE as 'sandbox' | 'live'
      })

      const planIdKey = `PAYPAL_PLAN_${plan.toUpperCase()}_${billingCycle.toUpperCase()}`
      const planId = c.env[planIdKey] as string

      const subscription = await paypal.createSubscription({
        planId,
        metadata: { userId: user.id, plan, billingCycle },
        returnUrl: `${c.env.APP_URL}/subscription/paypal/success`,
        cancelUrl: `${c.env.APP_URL}/pricing`
      })

      return c.json({
        provider: 'paypal',
        subscriptionId: subscription.subscriptionId,
        approvalUrl: subscription.approvalUrl
      })
    }

    return c.json({ error: 'Invalid provider' }, 400)

  } catch (error) {
    console.error('Checkout error:', error)
    return c.json({ error: 'Failed to create checkout session' }, 500)
  }
})

// Get current subscription
app.get('/current', async (c) => {
  const user = c.get('user')
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const subscription = await c.env.DB.prepare(`
    SELECT * FROM subscriptions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `).bind(user.id).first() as Subscription | null

  if (!subscription) {
    return c.json({ 
      plan: 'free',
      status: 'active',
      features: ['basic_templates']
    })
  }

  return c.json(subscription)
})

// Cancel subscription
app.post('/cancel', async (c) => {
  const user = c.get('user')
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const subscription = await c.env.DB.prepare(`
    SELECT * FROM subscriptions 
    WHERE user_id = ? AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 1
  `).bind(user.id).first() as Subscription | null

  if (!subscription) {
    return c.json({ error: 'No active subscription found' }, 404)
  }

  try {
    if (subscription.provider === 'paddle') {
      const paddle = new PaddleService({
        vendorId: c.env.PADDLE_VENDOR_ID,
        apiKey: c.env.PADDLE_API_KEY,
        environment: c.env.PADDLE_ENVIRONMENT as 'sandbox' | 'production'
      })

      await paddle.cancelSubscription(subscription.provider_subscription_id)
    } else if (subscription.provider === 'paypal') {
      const paypal = new PayPalService({
        clientId: c.env.PAYPAL_CLIENT_ID,
        clientSecret: c.env.PAYPAL_CLIENT_SECRET,
        mode: c.env.PAYPAL_MODE as 'sandbox' | 'live'
      })

      await paypal.cancelSubscription(subscription.provider_subscription_id)
    }

    // Update local database
    await c.env.DB.prepare(`
      UPDATE subscriptions 
      SET cancel_at_period_end = 1, updated_at = unixepoch()
      WHERE id = ?
    `).bind(subscription.id).run()

    return c.json({ success: true, message: 'Subscription will cancel at period end' })

  } catch (error) {
    console.error('Cancel error:', error)
    return c.json({ error: 'Failed to cancel subscription' }, 500)
  }
})

// Get customer portal URL (for Paddle)
app.get('/portal', async (c) => {
  const user = c.get('user')
  if (!user?.id) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const subscription = await c.env.DB.prepare(`
    SELECT * FROM subscriptions 
    WHERE user_id = ? AND provider = 'paddle' AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 1
  `).bind(user.id).first() as Subscription | null

  if (!subscription) {
    return c.json({ error: 'No active Paddle subscription found' }, 404)
  }

  try {
    const paddle = new PaddleService({
      vendorId: c.env.PADDLE_VENDOR_ID,
      apiKey: c.env.PADDLE_API_KEY,
      environment: c.env.PADDLE_ENVIRONMENT as 'sandbox' | 'production'
    })

    const portalUrl = await paddle.getCustomerPortalUrl(
      subscription.provider_customer_id
    )

    return c.json({ portalUrl })

  } catch (error) {
    console.error('Portal error:', error)
    return c.json({ error: 'Failed to get portal URL' }, 500)
  }
})

export default app
