// components/layout/sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { Badge } from '@/components/ui/badge'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Payments', href: '/payments', icon: DollarSign },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: subscription } = useSubscription()

  const handleLogout = () => {
    localStorage.removeItem('auth-token')
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <FileText className="h-8 w-8 text-blue-400" />
        <span className="ml-3 text-xl font-bold">InvoiceGen</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Subscription badge */}
      <div className="px-4 py-4 border-t border-gray-800">
        {subscription?.plan !== 'free' ? (
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Plan</span>
            <Badge variant="default" className="capitalize">
              {subscription?.plan}
            </Badge>
          </div>
        ) : (
          <Link href="/pricing">
            <Button variant="outline" className="w-full mb-3" size="sm">
              Upgrade Plan
            </Button>
          </Link>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
}
