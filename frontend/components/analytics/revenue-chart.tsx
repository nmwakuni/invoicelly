// components/analytics/revenue-chart.tsx
'use client'

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface RevenueChartProps {
  data: Array<{
    date: string
    amount: number
    count: number
  }>
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    dateFormatted: format(new Date(item.date), 'MMM dd'),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <XAxis
          dataKey="dateFormatted"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white border rounded-lg shadow-lg p-3">
                  <p className="text-sm font-medium">
                    {payload[0].payload.dateFormatted}
                  </p>
                  <p className="text-sm text-gray-600">
                    Revenue: {formatCurrency(payload[0].value as number)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Invoices: {payload[0].payload.count}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
