// lib/hooks/use-invoices.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '../api'
import { Invoice } from '../types'
import { toast } from 'sonner'

export function useInvoices(params?: any) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const { data } = await invoicesApi.getAll(params)
      return data.invoices as Invoice[]
    },
  })
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data } = await invoicesApi.getById(id)
      return data
    },
    enabled: !!id,
  })
}

export function useCreateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: any) => invoicesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice created successfully')
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Failed to create invoice'
      
      // Handle subscription limit errors
      if (error.response?.data?.upgrade) {
        toast.error(message, {
          action: {
            label: 'Upgrade',
            onClick: () => window.location.href = '/pricing'
          }
        })
      } else {
        toast.error(message)
      }
    },
  })
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      invoicesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.id] })
      toast.success('Invoice updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update invoice')
    },
  })
}

export function useSendInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      invoicesApi.send(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', variables.id] })
      toast.success('Invoice sent successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send invoice')
    },
  })
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => invoicesApi.markPaid(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoices', id] })
      toast.success('Invoice marked as paid')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mark invoice as paid')
    },
  })
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Invoice deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete invoice')
    },
  })
}
