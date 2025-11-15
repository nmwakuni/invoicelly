// src/middleware/auth.ts
import { Context, Next } from 'hono'

export async function authMiddleware(c: Context, next: Next) {
  const auth = c.get('auth')
  
  if (!auth) {
    return c.json({ error: 'Auth not initialized' }, 500)
  }

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Add user and session to context
  c.set('user', session.user)
  c.set('session', session.session)
  c.set('userId', session.user.id)

  await next()
}

// Alias for backward compatibility
export const requireAuth = authMiddleware

// Optional auth - doesn't fail if not authenticated
export async function optionalAuth(c: Context, next: Next) {
  const auth = c.get('auth')
  
  if (!auth) {
    await next()
    return
  }

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  })

  if (session) {
    c.set('user', session.user)
    c.set('session', session.session)
    c.set('userId', session.user.id)
  }

  await next()
}
