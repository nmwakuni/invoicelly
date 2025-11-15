'use client'

import { useSession } from '@/lib/auth'
import { useStore } from '@nanostores/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const publicRoutes = ['/login', '/register', '/forgot-password']

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useStore(useSession)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isPending) return

    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    if (!session && !isPublicRoute) {
      router.push('/login')
    } else if (session && isPublicRoute) {
      router.push('/dashboard')
    }
  }, [session, isPending, pathname, router])

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return <>{children}</>
}
