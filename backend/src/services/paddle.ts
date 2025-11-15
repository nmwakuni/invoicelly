// src/services/paddle.ts
import { z } from 'zod'

interface PaddleConfig {
  vendorId: string
  apiKey: string
  environment: 'sandbox' | 'production'
}

export class PaddleService {
  private config: PaddleConfig
  private baseUrl: string

  constructor(config: PaddleConfig) {
    this.config = config
    this.baseUrl = config.environment === 'sandbox' 
      ? 'https://sandbox-api.paddle.com'
      : 'https://api.paddle.com'
  }

  // Generate checkout URL
  async createCheckoutUrl(params: {
    priceId: string
    customerId?: string
    customerEmail?: string
    successUrl: string
    metadata?: Record<string, string>
  }) {
    const response = await fetch(`${this.baseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [{
          price_id: params.priceId,
          quantity: 1
        }],
        customer_id: params.customerId,
        customer_email: params.customerEmail,
        custom_data: params.metadata,
        settings: {
          success_url: params.successUrl,
          locale: 'en'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Paddle API error: ${response.statusText}`)
    }

    const data = await response.json() as { data: { url: string } }
    return data.data.url // Checkout URL
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    const response = await fetch(
      `${this.baseUrl}/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          effective_from: 'next_billing_period'
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to cancel subscription: ${response.statusText}`)
    }

    return response.json()
  }

  // Update subscription
  async updateSubscription(subscriptionId: string, newPriceId: string) {
    const response = await fetch(
      `${this.baseUrl}/subscriptions/${subscriptionId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: [{
            price_id: newPriceId,
            quantity: 1
          }],
          proration_billing_mode: 'prorated_immediately'
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update subscription: ${response.statusText}`)
    }

    return response.json()
  }

  // Verify webhook signature
  async verifyWebhook(signature: string, payload: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    )
    
    const digest = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    
    return signature === digest
  }

  // Get customer portal URL (for managing subscription)
  async getCustomerPortalUrl(customerId: string) {
    const response = await fetch(`${this.baseUrl}/customer-portal-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer_id: customerId
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to get portal URL: ${response.statusText}`)
    }

    const data = await response.json() as { data: { url: string } }
    return data.data.url
  }
}
