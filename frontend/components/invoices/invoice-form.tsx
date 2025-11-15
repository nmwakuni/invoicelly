// components/invoices/invoice-form.tsx
'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Calendar } from 'lucide-react'
import { useClients } from '@/lib/hooks/use-clients'
import { useCreateInvoice, useUpdateInvoice } from '@/lib/hooks/use-invoices'
import { useRouter, useSearchParams } from 'next/navigation'
import { Invoice } from '@/lib/types'

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Price cannot be negative'),
  amount: z.number(),
})

const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  issueDate: z.string(),
  dueDate: z.string(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  taxRate: z.number().min(0).max(100),
  discountRate: z.number().min(0).max(100),
  currency: z.string(),
  notes: z.string().optional(),
  terms: z.string().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface InvoiceFormProps {
  invoice?: Invoice & { items?: any[] }
}

export function InvoiceForm({ invoice }: InvoiceFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedClientId = searchParams.get('clientId')

  const { data: clients } = useClients()
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: invoice
      ? {
          clientId: invoice.clientId,
          issueDate: new Date(invoice.issueDate * 1000).toISOString().split('T')[0],
          dueDate: new Date(invoice.dueDate * 1000).toISOString().split('T')[0],
          items: invoice.items || [],
          taxRate: invoice.taxRate,
          discountRate: invoice.discountRate || 0,
          currency: invoice.currency,
          notes: invoice.notes,
          terms: invoice.terms,
        }
      : {
          clientId: preSelectedClientId || '',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
          taxRate: 0,
          discountRate: 0,
          currency: 'USD',
          notes: '',
          terms: 'Payment due within 30 days',
        },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  // Watch all items for calculations
  const watchedItems = watch('items')
  const taxRate = watch('taxRate')
  const discountRate = watch('discountRate')

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.amount || 0), 0)
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = subtotal * (discountRate / 100)
  const total = subtotal + taxAmount - discountAmount

  // Update item amount when quantity or price changes
  useEffect(() => {
    watchedItems.forEach((item, index) => {
      const amount = item.quantity * item.unitPrice
      if (item.amount !== amount) {
        setValue(`items.${index}.amount`, amount)
      }
    })
  }, [watchedItems, setValue])

  const onSubmit = async (data: InvoiceFormData) => {
    try {
      const formattedData = {
        ...data,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
      }

      if (invoice) {
        await updateInvoice.mutateAsync({ id: invoice.id, data: formattedData })
      } else {
        await createInvoice.mutateAsync(formattedData)
      }
      
      router.push('/invoices')
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Client & Dates */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="clientId">
                Client <span className="text-red-500">*</span>
              </Label>
              <Select
                value={watch('clientId')}
                onValueChange={(value) => setValue('clientId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.clientId && (
                <p className="text-sm text-red-500 mt-1">{errors.clientId.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="issueDate">
                Issue Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="issueDate"
                type="date"
                {...register('issueDate')}
              />
              {errors.issueDate && (
                <p className="text-sm text-red-500 mt-1">{errors.issueDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dueDate">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-500 mt-1">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={watch('currency')}
              onValueChange={(value) => setValue('currency', value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="KES">KES</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-semibold">Line Items</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ description: '', quantity: 1, unitPrice: 0, amount: 0 })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid gap-4 md:grid-cols-12 items-start">
                <div className="md:col-span-5">
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder="Description"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.items[index]?.description?.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    placeholder="Qty"
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                    placeholder="Price"
                  />
                </div>

                <div className="md:col-span-2">
                  <Input
                    value={watchedItems[index]?.amount.toFixed(2) || '0.00'}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>

                <div className="md:col-span-1">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 space-y-3 max-w-sm ml-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Tax:</span>
                <Input
                  type="number"
                  step="0.1"
                  {...register('taxRate', { valueAsNumber: true })}
                  className="w-20 h-8"
                  placeholder="0"
                />
                <span className="text-gray-600">%</span>
              </div>
              <span className="font-medium">{taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Discount:</span>
                <Input
                  type="number"
                  step="0.1"
                  {...register('discountRate', { valueAsNumber: true })}
                  className="w-20 h-8"
                  placeholder="0"
                />
                <span className="text-gray-600">%</span>
              </div>
              <span className="font-medium text-red-600">-{discountAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold pt-3 border-t">
              <span>Total:</span>
              <span>{total.toFixed(2)} {watch('currency')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Terms */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes for the client..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              {...register('terms')}
              placeholder="Payment terms and conditions..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : invoice
            ? 'Update Invoice'
            : 'Create Invoice'}
        </Button>
      </div>
    </form>
  )
}
