// tests/integration/subscriptions.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { env, SELF } from 'cloudflare:test'
import { seedTestData, cleanupTestData, createMockRequest } from '../utils/test-helpers'

describe('Subscriptions API', () => {
  let testData: any

  beforeEach(async () => {
    testData = await seedTestData(env.DB)
  })

  afterEach(async () => {
    await cleanupTestData(env.DB)
  })

  describe('POST /api/subscriptions/checkout', () => {
    it('should create Paddle checkout', async () => {
      const checkoutData = {
        plan: 'pro',
        provider: 'paddle',
        billingCycle: 'monthly'
      }

      // Mock Paddle API
      vi.mock('../../src/services/paddle', () => ({
        PaddleService: vi.fn().mockImplementation(() => ({
          createCheckoutUrl: vi.fn().mockResolvedValue('https://checkout.paddle.com/123')
        }))
      }))

      const request = createMockRequest(
        'POST',
        '/api/subscriptions/checkout',
        checkoutData
      )
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.checkoutUrl).toBeDefined()
      expect(data.provider).toBe('paddle')
    })

    it('should create PayPal subscription', async () => {
      const checkoutData = {
        plan: 'starter',
        provider: 'paypal',
        billingCycle: 'monthly'
      }

      const request = createMockRequest(
        'POST',
        '/api/subscriptions/checkout',
        checkoutData
      )
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.approvalUrl).toBeDefined()
      expect(data.provider).toBe('paypal')
    })

    it('should validate plan name', async () => {
      const invalidData = {
        plan: 'invalid-plan',
        provider: 'paddle'
      }

      const request = createMockRequest(
        'POST',
        '/api/subscriptions/checkout',
        invalidData
      )
      const response = await SELF.fetch(request)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/subscriptions/current', () => {
    it('should return free plan for new user', async () => {
      const request = createMockRequest('GET', '/api/subscriptions/current')
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.plan).toBe('free')
    })

    it('should return active subscription', async () => {
      // Create active subscription
      const subId = 'test-sub-123'
      await env.DB.prepare(`
        INSERT INTO subscriptions (
          id, user_id, plan, status, provider,
          current_period_start, current_period_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        subId,
        testData.userId,
        'pro',
        'active',
        'paddle',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 2592000
      ).run()

      await env.DB.prepare(
        'UPDATE users SET subscription_id = ? WHERE id = ?'
      ).bind(subId, testData.userId).run()

      const request = createMockRequest('GET', '/api/subscriptions/current')
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.plan).toBe('pro')
      expect(data.status).toBe('active')
    })
  })

  describe('POST /api/subscriptions/cancel', () => {
    it('should cancel active subscription', async () => {
      // Setup active subscription
      const subId = 'test-sub-cancel'
      await env.DB.prepare(`
        INSERT INTO subscriptions (
          id, user_id, plan, status, provider, provider_subscription_id,
          current_period_start, current_period_end
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        subId,
        testData.userId,
        'pro',
        'active',
        'paddle',
        'paddle_sub_123',
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000) + 2592000
      ).run()

      const request = createMockRequest('POST', '/api/subscriptions/cancel')
      const response = await SELF.fetch(request)

      expect(response.status).toBe(200)

      // Check cancel_at_period_end flag
      const subscription = await env.DB.prepare(
        'SELECT cancel_at_period_end FROM subscriptions WHERE id = ?'
      ).bind(subId).first()

      expect(subscription.cancel_at_period_end).toBe(1)
    })
  })
})
