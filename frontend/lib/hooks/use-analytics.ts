import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '../api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await analyticsApi.getOverview()
      return data
    },
  })
}

export function useRevenueData(period: string = '30d') {
  return useQuery({
    queryKey: ['revenue', period],
    queryFn: async () => {
      const { data } = await analyticsApi.getRevenue(period)
      return data.revenue
    },
  })
}
