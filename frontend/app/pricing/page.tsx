'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { useCreateCheckout } from '@/lib/hooks/use-subscription'

type Plan = {
  name: string
  description: string
  price: { monthly: number; annual: number }
  features: string[]
  popular?: boolean
}

const plans: Record<string, Plan> = {
  starter: {
    name: 'Starter',
    description: 'Perfect for freelancers and solo entrepreneurs',
    price: { monthly: 10, annual: 100 },
    features: [
      'Unlimited invoices',
      'Up to 50 clients',
      'Email sending',
      'Payment tracking',
      'Basic templates',
      'PDF export',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'For growing businesses and agencies',
    price: { monthly: 25, annual: 250 },
    popular: true,
    features: [
      'Everything in Starter',
      'Unlimited clients',
      'All premium templates',
      'Recurring invoices',
      'Client portal',
      'Advanced analytics',
      'Priority support',
    ],
  },
  business: {
    name: 'Business',
    description: 'For larger teams and enterprises',
    price: { monthly: 49, annual: 490 },
    features: [
      'Everything in Pro',
      'Team members (up to 10)',
      'White-label branding',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 phone support',
    ],
  },
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const createCheckout = useCreateCheckout()

  const handleSubscribe = (plan: string, provider: 'paddle' | 'paypal') => {
    createCheckout.mutate({
      plan,
      provider,
      billingCycle,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose the plan that's right for your business
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white rounded-lg p-1 shadow">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-md transition ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-2 rounded-md transition ${
                billingCycle === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <span className="ml-2 text-sm font-semibold text-green-600">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {Object.entries(plans).map(([key, plan]) => (
            <Card
              key={key}
              className={`relative ${
                plan.popular ? 'border-2 border-blue-500 shadow-xl' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${plan.price[billingCycle]}
                  </span>
                  <span className="text-gray-600 ml-2">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleSubscribe(key, 'paddle')}
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    Get Started
                  </Button>

                  <Button
                    onClick={() => handleSubscribe(key, 'paypal')}
                    className="w-full"
                    variant="outline"
                  >
                    Pay with PayPal
                  </Button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  14-day free trial • Cancel anytime
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans later?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  We accept all major credit cards (via Paddle) and PayPal. All payments are secure and encrypted.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Yes! All paid plans come with a 14-day free trial. No credit card required to start.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Absolutely. Cancel anytime with one click. You'll keep access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-6">
            We're here to help. Get in touch with our sales team.
          </p>
          <Button size="lg" variant="outline">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  )
}
