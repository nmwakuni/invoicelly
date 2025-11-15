export function Footer() {
    return (
      <footer className="border-t bg-white mt-auto">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} InvoiceGen. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Terms
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    )
  }
