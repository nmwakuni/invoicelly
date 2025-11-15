// tests/e2e/invoice-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { env, SELF } from 'cloudflare:test'
import { seedTestData, cleanupTestData, createMockRequest } from '../utils/test-helpers'

describe('Complete Invoice Flow (E2E)', () => {
  let testData: any
  let clientId: string
  let invoiceId: string

  beforeAll(async () => {
    testData = await seedTestData(env.DB)
  })

  afterAll(async () => {
    await cleanupTestData(env.DB)
  })

  it('should complete full invoice lifecycle', async () => {
    // STEP 1: Create client
    const clientData = {
      name: 'E2E Test Client',
      email: 'e2e@test.com',
      company: 'Test Corp'
    }

    let response = await SELF.fetch(
      createMockRequest('POST', '/api/clients', clientData)
    )
    let data = await response.json()
    
    expect(response.status).toBe(201)
    clientId = data.client.id

    // STEP 2: Create invoice
    const invoiceData = {
      clientId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          description: 'Consulting Services',
          quantity: 10,
          unitPrice: 150,
          amount: 1500
        }
      ],
      taxRate: 10,
      notes: 'Thank you for your business',
      currency: 'USD'
    }

    response = await SELF.fetch(
      createMockRequest('POST', '/api/invoices', invoiceData)
    )
    data = await response.json()

    expect(response.status).toBe(201)
    expect(data.invoice.status).toBe('draft')
    expect(data.invoice.total).toBe(1650) // 1500 * 1.1
    invoiceId = data.invoice.id

    // STEP 3: Send invoice
    const sendData = {
      to: 'e2e@test.com',
      subject: 'Your Invoice',
      message: 'Please review'
    }

    response = await SELF.fetch(
      createMockRequest('POST', `/api/invoices/${invoiceId}/send`, sendData)
    )
    
    expect(response.status).toBe(200)

    // Verify status changed
    response = await SELF.fetch(
      createMockRequest('GET', `/api/invoices/${invoiceId}`)
    )
    data = await response.json()
    expect(data.invoice.status).toBe('sent')

    // STEP 4: Record payment
    const paymentData = {
      invoiceId,
      amount: 1650,
      paymentMethod: 'bank_transfer',
      paymentDate: new Date(),
      reference: 'TXN-12345'
    }

    response = await SELF.fetch(
      createMockRequest('POST', '/api/payments', paymentData)
    )
    
    expect(response.status).toBe(201)

    // STEP 5: Verify invoice is paid
    response = await SELF.fetch(
      createMockRequest('GET', `/api/invoices/${invoiceId}`)
    )
    data = await response.json()

    expect(data.invoice.status).toBe('paid')
    expect(data.invoice.amount_paid).toBe(1650)

    // STEP 6: Check analytics updated
    response = await SELF.fetch(
      createMockRequest('GET', '/api/analytics/dashboard')
    )
    data = await response.json()

    expect(data.revenue.total).toBeGreaterThan(0)
    expect(data.invoices.paid).toBeGreaterThan(0)
  })
})
