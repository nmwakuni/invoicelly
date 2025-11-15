// tests/utils/test-helpers.ts
import { D1Database } from '@cloudflare/workers-types'

export async function createTestDB(): Promise<D1Database> {
  // This will use Miniflare's D1 implementation
  return env.DB
}

export async function seedTestData(db: D1Database) {
  // Create test user
  const userId = 'test-user-123'
  await db.prepare(`
    INSERT INTO users (id, email, name, business_name)
    VALUES (?, ?, ?, ?)
  `).bind(userId, 'test@example.com', 'Test User', 'Test Business').run()

  // Create test client
  const clientId = 'test-client-123'
  await db.prepare(`
    INSERT INTO clients (id, user_id, name, email, company)
    VALUES (?, ?, ?, ?, ?)
  `).bind(clientId, userId, 'Test Client', 'client@example.com', 'Client Co').run()

  // Create test invoice
  const invoiceId = 'test-invoice-123'
  await db.prepare(`
    INSERT INTO invoices (
      id, user_id, client_id, invoice_number, status,
      issue_date, due_date, subtotal, total, currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    invoiceId, userId, clientId, 'INV-0001', 'draft',
    Math.floor(Date.now() / 1000),
    Math.floor(Date.now() / 1000) + 2592000, // 30 days
    100, 100, 'USD'
  ).run()

  return { userId, clientId, invoiceId }
}

export async function cleanupTestData(db: D1Database) {
  await db.prepare('DELETE FROM invoice_items').run()
  await db.prepare('DELETE FROM invoices').run()
  await db.prepare('DELETE FROM clients').run()
  await db.prepare('DELETE FROM subscriptions').run()
  await db.prepare('DELETE FROM users').run()
}

export function mockAuthUser(userId: string) {
  return {
    id: userId,
    email: 'test@example.com',
    name: 'Test User'
  }
}

// Mock request helper
export function createMockRequest(
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
}
