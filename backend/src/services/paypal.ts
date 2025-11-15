// src/services/paypal.ts
interface PayPalConfig {
  clientId: string
  clientSecret: string
  mode: 'sandbox' | 'live'
}

interface PayPalTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface PayPalLink {
  href: string
  rel: string
  method: string
}

interface PayPalSubscriptionResponse {
  id: string
  status: string
  links: PayPalLink[]
}

interface PayPalWebhookVerification {
  verification_status: string
}

export class PayPalService {
  private config: PayPalConfig
  private baseUrl: string

  constructor(config: PayPalConfig) {
    this.config = config
    this.baseUrl = config.mode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com'
  }

  // Get OAuth token
  private async getAccessToken(): Promise<string> {
    // Convert credentials to base64 using browser-compatible method
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`
    const auth = btoa(credentials)

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (!response.ok) {
      throw new Error(`Failed to get PayPal access token: ${response.statusText}`)
    }

    const data = await response.json() as PayPalTokenResponse
    return data.access_token
  }

  // Create subscription
  async createSubscription(params: {
    planId: string
    customerId?: string
    metadata?: Record<string, string>
    returnUrl: string
    cancelUrl: string
  }) {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan_id: params.planId,
        subscriber: params.customerId ? {
          payer_id: params.customerId
        } : undefined,
        custom_id: JSON.stringify(params.metadata),
        application_context: {
          brand_name: 'Your Invoice App',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
          },
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`PayPal error: ${JSON.stringify(error)}`)
    }

    const data = await response.json() as PayPalSubscriptionResponse
    
    // Return approval URL for user to complete subscription
    const approvalUrl = data.links.find((link) => link.rel === 'approve')?.href
    
    return {
      subscriptionId: data.id,
      approvalUrl,
      status: data.status
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, reason?: string) {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: reason || 'Customer requested cancellation'
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to cancel PayPal subscription: ${response.statusText}`)
    }

    return { success: true }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string) {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get subscription details: ${response.statusText}`)
    }

    return response.json()
  }

  // Verify webhook signature
  verifyWebhook(headers: Record<string, string>, body: string, webhookId: string): Promise<boolean> {
    // PayPal webhook verification is more complex
    // You need to call their verification API
    return this.verifyWebhookSignature(headers, body, webhookId)
  }

  private async verifyWebhookSignature(
    headers: Record<string, string>,
    body: string,
    webhookId: string
  ): Promise<boolean> {
    const token = await this.getAccessToken()

    const response = await fetch(
      `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transmission_id: headers['paypal-transmission-id'],
          transmission_time: headers['paypal-transmission-time'],
          cert_url: headers['paypal-cert-url'],
          auth_algo: headers['paypal-auth-algo'],
          transmission_sig: headers['paypal-transmission-sig'],
          webhook_id: webhookId,
          webhook_event: JSON.parse(body)
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to verify webhook: ${response.statusText}`)
    }

    const data = await response.json() as PayPalWebhookVerification
    return data.verification_status === 'SUCCESS'
  }
}
