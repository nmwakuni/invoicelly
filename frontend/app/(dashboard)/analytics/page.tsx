'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { RevenueChart } from '@/components/analytics/revenue-chart'
import { TopClients } from '@/components/analytics/top-clients'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d')

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await analyticsApi.getOverview()
      return data
    },
  })

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['revenue', period],
    queryFn: async () => {
      const { data } = await analyticsApi.getRevenue({period})
      return data.revenue
    },
  })

  if (dashboardLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-500 mt-1">
            Insights into your business performance
          </p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData?.revenue?.total || 0)}
            </div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboardData?.revenue?.thisMonth || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(dashboardData?.revenue?.outstanding || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Unpaid invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(dashboardData?.revenue?.overdue || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Past due date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <LoadingSpinner />
            ) : (
              <RevenueChart data={revenueData || []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <TopClients clients={dashboardData?.topClients || []} />
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold">{dashboardData?.invoices?.total || 0}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-600">{dashboardData?.invoices?.draft || 0}</p>
              <p className="text-sm text-gray-600">Draft</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{dashboardData?.invoices?.sent || 0}</p>
              <p className="text-sm text-blue-600">Sent</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardData?.invoices?.paid || 0}</p>
              <p className="text-sm text-green-600">Paid</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{dashboardData?.invoices?.overdue || 0}</p>
              <p className="text-sm text-red-600">Overdue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
