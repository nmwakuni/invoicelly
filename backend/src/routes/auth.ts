// src/routes/auth.ts

import { Hono } from 'hono'
import { createAuth, Auth } from '../lib/auth'

type Bindings = Parameters<typeof createAuth>[0]
type Variables = { auth: Auth }

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Middleware to inject auth instance
app.use('*', async (c, next) => {
  // @ts-ignore
  c.set('auth', createAuth(c.env))
  await next()
})


// Register
app.post('/register', async (c) => {
  const auth = c.get('auth') as Auth
  const body = await c.req.json()
  const response = await auth.api.signUpEmail({ body, asResponse: true })
  return response
})

// Login
app.post('/login', async (c) => {
  const auth = c.get('auth') as Auth
  const body = await c.req.json()
  const response = await auth.api.signInEmail({ body, asResponse: true })
  return response
})

// Google OAuth start (redirect to better-auth social route)
app.get('/social/google', (c) => {
  // This route is handled by better-auth, just redirect
  return c.redirect('/api/auth/social/google')
})

// Google OAuth callback is handled by better-auth's built-in handler

// Logout
app.post('/logout', async (c) => {
  const auth = c.get('auth') as Auth
  const response = await auth.api.signOut({ headers: c.req.raw.headers, asResponse: true })
  return response
})

export default app
