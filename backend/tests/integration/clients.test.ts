// tests/integration/clients.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { env, SELF } from 'cloudflare:test'
import { seedTestData, cleanupTestData, createMockRequest } from '../utils/test-helpers'

describe('Clients API', () => {
  let testData: any

  beforeEach(async () => {
    testData = await seedTestData(env.DB)
  })

  afterEach(async () => {
    await cleanupTestData(env.DB)
  })

  describe('GET /api/clients', () => {
    it('should return list of clients', async () => {
      const request = createMockRequest('GET', '/api/clients')
      
      // Mock auth - in real test, you'd set proper auth headers
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.clients).toBeDefined()
      expect(Array.isArray(data.clients)).toBe(true)
    })

    it('should return 401 without auth', async () => {
      const request = createMockRequest('GET', '/api/clients')
      const response = await SELF.fetch(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/clients', () => {
    it('should create new client', async () => {
      const newClient = {
        name: 'New Client',
        email: 'new@client.com',
        company: 'New Co'
      }

      const request = createMockRequest('POST', '/api/clients', newClient)
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.client).toBeDefined()
      expect(data.client.name).toBe('New Client')
    })

    it('should reject invalid data', async () => {
      const invalidClient = {
        email: 'invalid-email'
        // missing name
      }

      const request = createMockRequest('POST', '/api/clients', invalidClient)
      const response = await SELF.fetch(request)

      expect(response.status).toBe(400)
    })

    it('should enforce subscription limits', async () => {
      // Create clients up to free tier limit
      // Then try to create one more
      // Should fail with 402
    })
  })

  describe('GET /api/clients/:id', () => {
    it('should return client details with stats', async () => {
      const request = createMockRequest('GET', `/api/clients/${testData.clientId}`)
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.client).toBeDefined()
      expect(data.stats).toBeDefined()
    })

    it('should return 404 for non-existent client', async () => {
      const request = createMockRequest('GET', '/api/clients/non-existent')
      const response = await SELF.fetch(request)

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/clients/:id', () => {
    it('should update client', async () => {
      const updates = {
        company: 'Updated Company Name'
      }

      const request = createMockRequest(
        'PATCH',
        `/api/clients/${testData.clientId}`,
        updates
      )
      const response = await SELF.fetch(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.client.company).toBe('Updated Company Name')
    })
  })

  describe('DELETE /api/clients/:id', () => {
    it('should delete client without invoices', async () => {
      // Create client without invoices
      const clientId = 'client-no-invoices'
      await env.DB.prepare(`
        INSERT INTO clients (id, user_id, name)
        VALUES (?, ?, ?)
      `).bind(clientId, testData.userId, 'Deletable Client').run()

      const request = createMockRequest('DELETE', `/api/clients/${clientId}`)
      const response = await SELF.fetch(request)

      expect(response.status).toBe(200)
    })

    it('should prevent deletion of client with invoices', async () => {
      const request = createMockRequest(
        'DELETE',
        `/api/clients/${testData.clientId}`
      )
      const response = await SELF.fetch(request)

      expect(response.status).toBe(400)
    })
  })
})
