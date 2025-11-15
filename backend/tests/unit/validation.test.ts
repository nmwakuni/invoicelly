// tests/unit/validation.test.ts
import { describe, it, expect } from 'vitest'
import {
  createClientSchema,
  createInvoiceSchema,
  invoiceItemSchema
} from '../../src/utils/validation'

describe('Validation Schemas', () => {
  describe('createClientSchema', () => {
    it('should validate valid client data', () => {
      const validClient = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp'
      }

      const result = createClientSchema.safeParse(validClient)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidClient = {
        name: 'John Doe',
        email: 'not-an-email'
      }

      const result = createClientSchema.safeParse(invalidClient)
      expect(result.success).toBe(false)
    })

    it('should reject missing name', () => {
      const invalidClient = {
        email: 'john@example.com'
      }

      const result = createClientSchema.safeParse(invalidClient)
      expect(result.success).toBe(false)
    })
  })

  describe('invoiceItemSchema', () => {
    it('should validate valid invoice item', () => {
      const validItem = {
        description: 'Web Development',
        quantity: 10,
        unitPrice: 100,
        amount: 1000
      }

      const result = invoiceItemSchema.safeParse(validItem)
      expect(result.success).toBe(true)
    })

    it('should reject negative quantity', () => {
      const invalidItem = {
        description: 'Web Development',
        quantity: -5,
        unitPrice: 100,
        amount: -500
      }

      const result = invoiceItemSchema.safeParse(invalidItem)
      expect(result.success).toBe(false)
    })
  })

  describe('createInvoiceSchema', () => {
    it('should validate valid invoice', () => {
      const validInvoice = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        items: [
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

      const result = createInvoiceSchema.safeParse(validInvoice)
      expect(result.success).toBe(true)
    })

    it('should reject invoice without items', () => {
      const invalidInvoice = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        issueDate: new Date(),
        dueDate: new Date(),
        items: [],
        currency: 'USD'
      }

      const result = createInvoiceSchema.safeParse(invalidInvoice)
      expect(result.success).toBe(false)
    })
  })
})
