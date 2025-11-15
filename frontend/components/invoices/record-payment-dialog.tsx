'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRecordPayment } from '@/lib/hooks/use-payments'
import { Invoice } from '@/lib/types'

const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.coerce
    .number()
    .positive('Amount must be positive')
    .max(9999999999, 'Payment amount exceeds maximum'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>

interface RecordPaymentDialogProps {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RecordPaymentDialog({
  invoice,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  const recordPayment = useRecordPayment()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      invoiceId: invoice.id,
      amount: invoice.total - (invoice.amountPaid || 0),
      paymentMethod: 'bank_transfer',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: '',
      notes: '',
    },
  })

  const onSubmit = async (data: RecordPaymentFormData) => {
    try {
      await recordPayment.mutateAsync(data)
      reset()
      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  const remainingBalance = invoice.total - (invoice.amountPaid || 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for invoice {invoice.invoiceNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('invoiceId')} />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.amount.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Remaining: {invoice.currency} {remainingBalance.toFixed(2)}
              </p>
            </div>

            <div>
              <Label htmlFor="paymentDate">
                Payment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paymentDate"
                type="date"
                {...register('paymentDate')}
              />
              {errors.paymentDate && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.paymentDate.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="paymentMethod">
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <select
              id="paymentMethod"
              {...register('paymentMethod')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
              <option value="other">Other</option>
            </select>
            {errors.paymentMethod && (
              <p className="text-sm text-red-500 mt-1">
                {errors.paymentMethod.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              {...register('reference')}
              placeholder="Transaction reference"
            />
            {errors.reference && (
              <p className="text-sm text-red-500 mt-1">
                {errors.reference.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about this payment"
              rows={3}
            />
            {errors.notes && (
              <p className="text-sm text-red-500 mt-1">
                {errors.notes.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
