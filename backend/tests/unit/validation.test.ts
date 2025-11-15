import { describe, it, expect } from 'vitest'
import {
  createClientSchema,
  createInvoiceSchema,
  sendInvoiceSchema,
  recordPaymentSchema,
} from '../../src/utils/validation'

describe('Validation Schemas', () => {
  describe('createClientSchema', () => {
    it('should validate valid client data', () => {
      const validClient = {
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Corp',
      }
      const result = createClientSchema.safeParse(validClient)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidClient = {
        name: 'John Doe',
        email: 'not-an-email',
      }
      const result = createClientSchema.safeParse(invalidClient)
      expect(result.success).toBe(false)
    })

    it('should reject missing name', () => {
      const invalidClient = {
        email: 'john@example.com',
      }
      const result = createClientSchema.safeParse(invalidClient)
      expect(result.success).toBe(false)
    })
  })

  describe('sendInvoiceSchema', () => {
    it('should validate valid send invoice data', () => {
      const validData = {
        to: 'client@example.com',
        subject: 'Invoice INV-001',
        message: 'Please find attached',
      }
      const result = sendInvoiceSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        to: 'not-an-email',
      }
      const result = sendInvoiceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('recordPaymentSchema', () => {
    it('should validate valid payment data', () => {
      const validData = {
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 100.50,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date(),
      }
      const result = recordPaymentSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject negative amount', () => {
      const invalidData = {
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        amount: -100,
        paymentMethod: 'cash',
        paymentDate: new Date(),
      }
      const result = recordPaymentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject amount exceeding max', () => {
      const invalidData = {
        invoiceId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 10000000000, // Exceeds max
        paymentMethod: 'cash',
        paymentDate: new Date(),
      }
      const result = recordPaymentSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
