// src/routes/webhooks.ts
import { Hono } from 'hono'
import { PaddleService } from '../services/paddle'
import { PayPalService } from '../services/paypal'

type Bindings = {
  DB: D1Database
  PADDLE_WEBHOOK_SECRET: string
  PADDLE_VENDOR_ID: string
  PADDLE_API_KEY: string
  PADDLE_ENVIRONMENT: string
  PAYPAL_WEBHOOK_ID: string
  PAYPAL_CLIENT_ID: string
  PAYPAL_CLIENT_SECRET: string
  PAYPAL_MODE: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Paddle webhook
app.post('/paddle', async (c) => {
  const signature = c.req.header('paddle-signature')
  const body = await c.req.text()

  if (!signature) {
    return c.json({ error: 'Missing signature' }, 400)
  }

  const paddle = new PaddleService({
    vendorId: c.env.PADDLE_VENDOR_ID,
    apiKey: c.env.PADDLE_API_KEY,
    environment: c.env.PADDLE_ENVIRONMENT as 'sandbox' | 'production'
  })

  // Verify webhook
  const isValid = paddle.verifyWebhook(
    signature,
    body,
    c.env.PADDLE_WEBHOOK_SECRET
  )

  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401)
  }

  const event = JSON.parse(body)

  // Log webhook
  await c.env.DB.prepare(`
    INSERT INTO webhook_events (id, provider, event_type, payload, processed)
    VALUES (?, ?, ?, ?, 0)
  `).bind(
    crypto.randomUUID(),
    'paddle',
    event.event_type,
    body
  ).run()

  // Handle different event types
  try {
    switch (event.event_type) {
      case 'subscription.created':
      case 'subscription.activated':
        await handlePaddleSubscriptionCreated(c.env.DB, event.data)
        break

      case 'subscription.updated':
        await handlePaddleSubscriptionUpdated(c.env.DB, event.data)
        break

      case 'subscription.canceled':
        await handlePaddleSubscriptionCanceled(c.env.DB, event.data)
        break

      case 'transaction.completed':
        await handlePaddlePayment(c.env.DB, event.data)
        break

      default:
        console.log('Unhandled Paddle event:', event.event_type)
    }

    // Mark as processed
    await c.env.DB.prepare(`
      UPDATE webhook_events 
      SET processed = 1 
      WHERE payload = ?
    `).bind(body).run()

  } catch (error) {
    console.error('Webhook processing error:', error)
    return c.json({ error: 'Processing failed' }, 500)
  }

  return c.json({ received: true })
})

// PayPal webhook
app.post('/paypal', async (c) => {
  const headers = Object.fromEntries(c.req.raw.headers.entries())
  const body = await c.req.text()

  const paypal = new PayPalService({
    clientId: c.env.PAYPAL_CLIENT_ID,
    clientSecret: c.env.PAYPAL_CLIENT_SECRET,
    mode: c.env.PAYPAL_MODE as 'sandbox' | 'live'
  })

  // Verify webhook
  const isValid = await paypal.verifyWebhook(
    headers,
    body,
    c.env.PAYPAL_WEBHOOK_ID
  )

  if (!isValid) {
    return c.json({ error: 'Invalid signature' }, 401)
  }

  const event = JSON.parse(body)

  // Log webhook
  await c.env.DB.prepare(`
    INSERT INTO webhook_events (id, provider, event_type, payload, processed)
    VALUES (?, ?, ?, ?, 0)
  `).bind(
    crypto.randomUUID(),
    'paypal',
    event.event_type,
    body
  ).run()

  try {
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handlePayPalSubscriptionCreated(c.env.DB, event.resource)
        break

      case 'BILLING.SUBSCRIPTION.UPDATED':
        await handlePayPalSubscriptionUpdated(c.env.DB, event.resource)
        break

      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handlePayPalSubscriptionCanceled(c.env.DB, event.resource)
        break

      case 'PAYMENT.SALE.COMPLETED':
        await handlePayPalPayment(c.env.DB, event.resource)
        break

      default:
        console.log('Unhandled PayPal event:', event.event_type)
    }

    await c.env.DB.prepare(`
      UPDATE webhook_events 
      SET processed = 1 
      WHERE payload = ?
    `).bind(body).run()

  } catch (error) {
    console.error('PayPal webhook error:', error)
    return c.json({ error: 'Processing failed' }, 500)
  }

  return c.json({ received: true })
})

// Helper functions for Paddle
async function handlePaddleSubscriptionCreated(db: D1Database, data: any) {
  const customData = JSON.parse(data.custom_data || '{}')
  const userId = customData.userId

  if (!userId) {
    console.error('No userId in custom_data')
    return
  }

  const subscriptionId = crypto.randomUUID()
  
  await db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, plan, status, provider,
      provider_subscription_id, provider_customer_id,
      current_period_start, current_period_end,
      cancel_at_period_end
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).bind(
    subscriptionId,
    userId,
    customData.plan,
    'active',
    'paddle',
    data.id,
    data.customer_id,
    Math.floor(new Date(data.current_billing_period.starts_at).getTime() / 1000),
    Math.floor(new Date(data.current_billing_period.ends_at).getTime() / 1000)
  ).run()

  // Update user
  await db.prepare(`
    UPDATE users 
    SET subscription_id = ? 
    WHERE id = ?
  `).bind(subscriptionId, userId).run()
}

async function handlePaddleSubscriptionUpdated(db: D1Database, data: any) {
  await db.prepare(`
    UPDATE subscriptions 
    SET 
      status = ?,
      current_period_start = ?,
      current_period_end = ?,
      updated_at = unixepoch()
    WHERE provider_subscription_id = ?
  `).bind(
    data.status === 'active' ? 'active' : data.status,
    Math.floor(new Date(data.current_billing_period.starts_at).getTime() / 1000),
    Math.floor(new Date(data.current_billing_period.ends_at).getTime() / 1000),
    data.id
  ).run()
}

async function handlePaddleSubscriptionCanceled(db: D1Database, data: any) {
  await db.prepare(`
    UPDATE subscriptions 
    SET 
      status = 'canceled',
      updated_at = unixepoch()
    WHERE provider_subscription_id = ?
  `).bind(data.id).run()
}

async function handlePaddlePayment(db: D1Database, data: any) {
  const customData = JSON.parse(data.custom_data || '{}')
  
  await db.prepare(`
    INSERT INTO payments (
      id, user_id, subscription_id, amount, currency,
      status, provider, provider_payment_id, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    customData.userId,
    data.subscription_id,
    parseFloat(data.details.totals.total),
    data.currency_code,
    'succeeded',
    'paddle',
    data.id,
    `Payment for ${customData.plan} plan`
  ).run()
}

// Helper functions for PayPal (similar pattern)
async function handlePayPalSubscriptionCreated(db: D1Database, data: any) {
  const customData = JSON.parse(data.custom_id || '{}')
  const userId = customData.userId

  if (!userId) return

  const subscriptionId = crypto.randomUUID()
  
  await db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, plan, status, provider,
      provider_subscription_id, provider_customer_id,
      current_period_start, current_period_end,
      cancel_at_period_end
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).bind(
    subscriptionId,
    userId,
    customData.plan,
    'active',
    'paypal',
    data.id,
    data.subscriber?.payer_id,
    Math.floor(new Date(data.start_time).getTime() / 1000),
    Math.floor(new Date(data.billing_info?.next_billing_time).getTime() / 1000)
  ).run()

  await db.prepare(`
    UPDATE users 
    SET subscription_id = ? 
    WHERE id = ?
  `).bind(subscriptionId, userId).run()
}

async function handlePayPalSubscriptionUpdated(db: D1Database, data: any) {
  await db.prepare(`
    UPDATE subscriptions 
    SET 
      status = ?,
      updated_at = unixepoch()
    WHERE provider_subscription_id = ?
  `).bind(
    data.status === 'ACTIVE' ? 'active' : 'canceled',
    data.id
  ).run()
}

async function handlePayPalSubscriptionCanceled(db: D1Database, data: any) {
  await db.prepare(`
    UPDATE subscriptions 
    SET 
      status = 'canceled',
      updated_at = unixepoch()
    WHERE provider_subscription_id = ?
  `).bind(data.id).run()
}

async function handlePayPalPayment(db: D1Database, data: any) {
  // PayPal payment handling logic
  const billingAgreementId = data.billing_agreement_id
  
  const subscription = await db.prepare(`
    SELECT * FROM subscriptions 
    WHERE provider_subscription_id = ?
  `).bind(billingAgreementId).first()

  if (!subscription) return

  await db.prepare(`
    INSERT INTO payments (
      id, user_id, subscription_id, amount, currency,
      status, provider, provider_payment_id, description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    subscription.user_id,
    subscription.id,
    parseFloat(data.amount.total),
    data.amount.currency,
    'succeeded',
    'paypal',
    data.id,
    'Subscription payment'
  ).run()
}

export default app
