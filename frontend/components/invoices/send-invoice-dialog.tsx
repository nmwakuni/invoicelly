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
import { useSendInvoice } from '@/lib/hooks/use-invoices'
import { Invoice } from '@/lib/types'

const sendInvoiceSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().optional(),
  message: z.string().optional(),
})

type SendInvoiceFormData = z.infer<typeof sendInvoiceSchema>

interface SendInvoiceDialogProps {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendInvoiceDialog({
  invoice,
  open,
  onOpenChange,
}: SendInvoiceDialogProps) {
  const sendInvoice = useSendInvoice()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SendInvoiceFormData>({
    resolver: zodResolver(sendInvoiceSchema),
    defaultValues: {
      to: invoice.client?.email || '',
      subject: `Invoice ${invoice.invoiceNumber}`,
      message: `Dear ${invoice.client?.name || 'Client'},\n\nPlease find attached invoice ${invoice.invoiceNumber} for your review.\n\nThank you for your business!`,
    },
  })

  const onSubmit = async (data: SendInvoiceFormData) => {
    try {
      await sendInvoice.mutateAsync({ id: invoice.id, data })
      reset()
      onOpenChange(false)
    } catch (error) {
      // Error handled by mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Invoice</DialogTitle>
          <DialogDescription>
            Send invoice {invoice.invoiceNumber} via email
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="to">
              Recipient Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="to"
              type="email"
              {...register('to')}
              placeholder="client@example.com"
            />
            {errors.to && (
              <p className="text-sm text-red-500 mt-1">{errors.to.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              {...register('subject')}
              placeholder="Invoice subject"
            />
            {errors.subject && (
              <p className="text-sm text-red-500 mt-1">
                {errors.subject.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Email message"
              rows={6}
            />
            {errors.message && (
              <p className="text-sm text-red-500 mt-1">
                {errors.message.message}
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
              {isSubmitting ? 'Sending...' : 'Send Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
