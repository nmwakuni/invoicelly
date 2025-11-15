// src/middleware/rate-limit.ts
import arcjet, { tokenBucket, detectBot } from '@arcjet/bun'
import { Context, Next } from 'hono'

export function createArcjet(env: any) {
  return arcjet({
    key: env.ARCJET_KEY,
    rules: [
      // Bot detection
      detectBot({
        mode: 'LIVE',
        allow: [] // Allow specific bots if needed
      }),
      // Rate limit for API
      tokenBucket({
        mode: 'LIVE',
        characteristics: ['userId'],
        refillRate: 10, // tokens per interval
        interval: 60, // seconds
        capacity: 100 // max tokens
      })
    ]
  })
}

export function rateLimitMiddleware(options?: {
  max?: number
  window?: string
}) {
  return async (c: Context, next: Next) => {
    const aj = createArcjet(c.env)
    const userId = c.get('user')?.id || c.req.header('x-forwarded-for') || 'anonymous'
    
    const decision = await aj.protect(c.req.raw, {
      userId,
      requested: 1
    })

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return c.json({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
        }, 429)
      }

      if (decision.reason.isBot()) {
        return c.json({
          error: 'Bot detected',
          message: 'Automated requests are not allowed'
        }, 403)
      }

      return c.json({ error: 'Request blocked' }, 403)
    }

    // Add rate limit headers (if available in decision)
    if (decision.reason.isRateLimit && decision.reason.isRateLimit()) {
      const rateLimitInfo = decision.reason as any
      c.header('X-RateLimit-Limit', rateLimitInfo.limit?.toString() || '100')
      c.header('X-RateLimit-Remaining', rateLimitInfo.remaining?.toString() || '0')
    }

    await next()
  }
}
