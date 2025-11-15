// app/(dashboard)/dashboard/page.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, FileText, Users, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { TopClients } from '@/components/analytics/top-clients'
import { RecentInvoices } from '@/components/dashboard/recent-invoices'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await analyticsApi.getOverview()
      return data
    },
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Welcome back! Here's what's happening with your invoices.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue?.total || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(stats?.revenue?.thisMonth || 0)} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Outstanding
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.revenue?.outstanding || 0)}
            </div>
            <p className="text-xs text-red-500 mt-1">
              {formatCurrency(stats?.revenue?.overdue || 0)} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Invoices
            </CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.invoices?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.invoices?.paid || 0} paid, {stats?.invoices?.sent || 0} sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Clients
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clients?.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={stats?.trends || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <TopClients clients={stats?.topClients || []} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentInvoices />
        </CardContent>
      </Card>
    </div>
  )
}
