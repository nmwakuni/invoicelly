// src/routes/users.ts
import { Hono } from 'hono'

// Define types
interface User {
  id: string
  email: string
  name?: string
  businessName?: string
  businessAddress?: string
  taxId?: string
  createdAt: number
  updatedAt: number
}

interface Env {
  DB: D1Database
}

type Variables = {
  user: User
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Get current user profile
app.get('/me', async (c) => {
  const user = c.get('user')
  return c.json({ user })
})

// Update user profile
app.patch('/me', async (c) => {
  const user = c.get('user')
  const db = c.env.DB
  
  const body = await c.req.json() as Partial<{
    name: string
    businessName: string
    businessAddress: string
    taxId: string
  }>
  
  const updates: string[] = []
  const values: any[] = []
  
  if (body.name) {
    updates.push('name = ?')
    values.push(body.name)
  }
  
  if (body.businessName) {
    updates.push('businessName = ?')
    values.push(body.businessName)
  }
  
  if (body.businessAddress) {
    updates.push('businessAddress = ?')
    values.push(body.businessAddress)
  }
  
  if (body.taxId) {
    updates.push('taxId = ?')
    values.push(body.taxId)
  }
  
  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400)
  }
  
  updates.push('updatedAt = ?')
  values.push(Date.now())
  values.push(user.id)
  
  await db
    .prepare(`UPDATE user SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run()
  
  const updatedUser = await db
    .prepare('SELECT * FROM user WHERE id = ?')
    .bind(user.id)
    .first() as User | null
  
  return c.json({ user: updatedUser })
})

export default app
