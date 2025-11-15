import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '../api'
import { toast } from 'sonner'

export function useRecordPayment() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => paymentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Payment recorded successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to record payment')
    },
  })
}

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      const { data } = await paymentsApi.getByInvoice(invoiceId)
      return data.payments
    },
    enabled: !!invoiceId,
  })
}
