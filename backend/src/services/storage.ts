// R2 Storage Service - Helper functions for file management

export class StorageService {
    private r2: R2Bucket
  
    constructor(r2: R2Bucket) {
      this.r2 = r2
    }
  
    /**
     * Upload a PDF invoice
     */
    async uploadInvoicePDF(
      invoiceId: string,
      pdfBuffer: ArrayBuffer,
      metadata?: Record<string, string>
    ): Promise<string> {
      const key = `invoices/${invoiceId}.pdf`
  
      await this.r2.put(key, pdfBuffer, {
        httpMetadata: {
          contentType: 'application/pdf',
        },
        customMetadata: {
          invoiceId,
          uploadedAt: new Date().toISOString(),
          ...metadata,
        },
      })
  
      return key
    }
  
    /**
     * Get invoice PDF
     */
    async getInvoicePDF(invoiceId: string): Promise<ArrayBuffer | null> {
      const key = `invoices/${invoiceId}.pdf`
      const object = await this.r2.get(key)
  
      if (!object) {
        return null
      }
  
      return await object.arrayBuffer()
    }
  
    /**
     * Delete invoice PDF
     */
    async deleteInvoicePDF(invoiceId: string): Promise<void> {
      const key = `invoices/${invoiceId}.pdf`
      await this.r2.delete(key)
    }
  
    /**
     * Check if invoice PDF exists
     */
    async invoicePDFExists(invoiceId: string): Promise<boolean> {
      const key = `invoices/${invoiceId}.pdf`
      const object = await this.r2.head(key)
      return object !== null
    }
  
    /**
     * Get signed URL for invoice PDF (for download)
     */
    async getSignedURL(invoiceId: string, expiresIn: number = 3600): Promise<string> {
      // Note: R2 doesn't have built-in signed URLs yet
      // You'd need to implement your own token-based system
      // For now, we'll return a simple key
      return `invoices/${invoiceId}.pdf`
    }
  
    /**
     * List all invoices for a user
     */
    async listUserInvoices(userId: string): Promise<string[]> {
      const prefix = `invoices/user-${userId}/`
      const listed = await this.r2.list({ prefix })
  
      return listed.objects.map((obj) => obj.key)
    }
  
    /**
     * Upload user avatar
     */
    async uploadAvatar(
      userId: string,
      imageBuffer: ArrayBuffer,
      contentType: string
    ): Promise<string> {
      const extension = contentType.split('/')[1]
      const key = `avatars/${userId}.${extension}`
  
      await this.r2.put(key, imageBuffer, {
        httpMetadata: {
          contentType,
        },
      })
  
      return key
    }
  
    /**
     * Delete user avatar
     */
    async deleteAvatar(userId: string): Promise<void> {
      // Try common extensions
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      
      for (const ext of extensions) {
        await this.r2.delete(`avatars/${userId}.${ext}`)
      }
    }
  }
