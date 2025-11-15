// tests/integration/invoices.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { env, SELF } from 'cloudflare:test'
import { seedTestData, cleanupTestData, createMockRequest } from '../utils/test-helpers'

describe('Invoices API', () => {
  let testData: any

  beforeEach(async () => {
    testData = await seedTestData(env.DB)
  })

  afterEach(async () => {
    await cleanupTestData(env.DB)
  })

  describe('POST /api/invoices', () => {
    it('should create invoice with items', async () => {
      const newInvoice = {
        clientId: testData.clientId,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
          {
            description: 'Web Development',
            quantity: 10,
            unitPrice: 100,
            amount: 1000
          },
          {
            description: 'Consulting',
            quantity: 5,
            unitPrice: 150,
            amount: 750
          }
        ],
        taxRate: 10,
        currency: 'USD'
      }

      const request = createMockRequest('POST', '/api/invoices', newInvoice)
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.invoice).toBeDefined()
      expect(data.invoice.invoice_number).toMatch(/^INV-/)
      expect(data.invoice.total).toBe(1925) // (1000 + 750) * 1.1
    })

    it('should auto-increment invoice number', async () => {
      // Create first invoice
      const invoice1 = {
        clientId: testData.clientId,
        issueDate: new Date(),
        dueDate: new Date(),
        items: [{ description: 'Test', quantity: 1, unitPrice: 100, amount: 100 }],
        currency: 'USD'
      }

      const response1 = await SELF.fetch(
        createMockRequest('POST', '/api/invoices', invoice1)
      )
      const data1 = await response1.json()

      // Create second invoice
      const response2 = await SELF.fetch(
        createMockRequest('POST', '/api/invoices', invoice1)
      )
      const data2 = await response2.json()

      const number1 = parseInt(data1.invoice.invoice_number.split('-')[1])
      const number2 = parseInt(data2.invoice.invoice_number.split('-')[1])

      expect(number2).toBe(number1 + 1)
    })
  })

  describe('GET /api/invoices/:id', () => {
    it('should return invoice with items', async () => {
      const request = createMockRequest('GET', `/api/invoices/${testData.invoiceId}`)
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.invoice).toBeDefined()
      expect(data.items).toBeDefined()
      expect(Array.isArray(data.items)).toBe(true)
    })
  })

  describe('PATCH /api/invoices/:id', () => {
    it('should update draft invoice', async () => {
      const updates = {
        notes: 'Updated notes'
      }

      const request = createMockRequest(
        'PATCH',
        `/api/invoices/${testData.invoiceId}`,
        updates
      )
      const response = await SELF.fetch(request)

      expect(response.status).toBe(200)
    })

    it('should prevent editing paid invoice', async () => {
      // Mark invoice as paid
      await env.DB.prepare(
        'UPDATE invoices SET status = ? WHERE id = ?'
      ).bind('paid', testData.invoiceId).run()

      const request = createMockRequest(
        'PATCH',
        `/api/invoices/${testData.invoiceId}`,
        { notes: 'Try to update' }
      )
      const response = await SELF.fetch(request)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/invoices/:id/send', () => {
    it('should send invoice email', async () => {
      const sendData = {
        to: 'client@example.com',
        subject: 'Your Invoice',
        message: 'Please find attached'
      }

      const request = createMockRequest(
        'POST',
        `/api/invoices/${testData.invoiceId}/send`,
        sendData
      )
      const response = await SELF.fetch(request)

      expect(response.status).toBe(200)

      // Check invoice status updated
      const invoice = await env.DB.prepare(
        'SELECT status FROM invoices WHERE id = ?'
      ).bind(testData.invoiceId).first()

      expect(invoice.status).toBe('sent')
    })
  })
})
