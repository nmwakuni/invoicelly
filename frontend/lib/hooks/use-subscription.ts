// lib/hooks/use-subscription.ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { subscriptionsApi } from '../api'
import { toast } from 'sonner'

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await subscriptionsApi.getCurrent()
      return data
    },
  })
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (data: any) => subscriptionsApi.checkout(data),
    onSuccess: (response) => {
      const { data } = response
      
      // Redirect to checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create checkout')
    },
  })
}

export function useCancelSubscription() {
  return useMutation({
    mutationFn: () => subscriptionsApi.cancel(),
    onSuccess: () => {
      toast.success('Subscription canceled')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to cancel subscription')
    },
  })
}
