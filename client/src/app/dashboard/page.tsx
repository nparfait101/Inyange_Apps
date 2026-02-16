'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'
import {
  LayoutDashboard,
  Plane,
  Fuel,
  DollarSign,
  ShoppingCart,
  Shield,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import api from '@/lib/api'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<any>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    try {
      const [travel, fuel, pettyCash, sales, gatePass] = await Promise.all([
        api.get('/travel').catch(() => ({ data: [] })),
        api.get('/fuel').catch(() => ({ data: [] })),
        api.get('/petty-cash').catch(() => ({ data: [] })),
        user?.role === 'administrator' ||
        user?.department === 'Commercial' ||
        user?.department === 'Inventory' ||
        user?.department === 'Finance' ||
        user?.permissions?.canAccessSales
          ? api.get('/sales').catch(() => ({ data: [] }))
          : Promise.resolve({ data: [] }),
        api.get('/gate-pass').catch(() => ({ data: [] })),
      ])

      const travelData = travel.data || []
      const fuelData = fuel.data || []
      const pettyCashData = pettyCash.data || []
      const salesData = sales.data || []
      const gatePassData = gatePass.data || []

      setStats({
        travel: {
          total: travelData.length,
          pending: travelData.filter((r: any) => r.status === 'pending').length,
          approved: travelData.filter((r: any) => r.status === 'approved' || r.status === 'paid').length,
        },
        fuel: {
          total: fuelData.length,
          pending: fuelData.filter((r: any) => r.status === 'pending').length,
          approved: fuelData.filter((r: any) => r.status === 'approved' || r.status === 'served').length,
        },
        pettyCash: {
          total: pettyCashData.length,
          pending: pettyCashData.filter((r: any) => r.status === 'pending').length,
          approved: pettyCashData.filter((r: any) => r.status === 'approved' || r.status === 'paid').length,
        },
        sales: {
          total: salesData.length,
          pending: salesData.filter((r: any) => r.status === 'pending').length,
          inProgress: salesData.filter((r: any) => r.status === 'in-progress').length,
        },
        gatePass: {
          total: gatePassData.length,
          pending: gatePassData.filter((r: any) => r.status === 'pending').length,
          approved: gatePassData.filter((r: any) => r.status === 'approved').length,
        },
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) return null

  const hasSalesAccess =
    user.role === 'administrator' ||
    user.department === 'Commercial' ||
    user.department === 'Inventory' ||
    user.department === 'Finance' ||
    user.permissions?.canAccessSales

  const modules = [
    {
      name: 'Travel Requests',
      href: '/travel',
      icon: Plane,
      color: 'bg-blue-500',
      stats: stats.travel,
    },
    {
      name: 'Fuel & Vehicle',
      href: '/fuel',
      icon: Fuel,
      color: 'bg-green-500',
      stats: stats.fuel,
    },
    {
      name: 'Petty Cash',
      href: '/petty-cash',
      icon: DollarSign,
      color: 'bg-yellow-500',
      stats: stats.pettyCash,
    },
    ...(hasSalesAccess
      ? [
          {
            name: 'Sales Orders',
            href: '/sales',
            icon: ShoppingCart,
            color: 'bg-purple-500',
            stats: stats.sales,
          },
        ]
      : []),
    {
      name: 'Gate Pass',
      href: '/gate-pass',
      icon: Shield,
      color: 'bg-indigo-500',
      stats: stats.gatePass,
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${module.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {module.stats?.total || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {module.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        Pending: {module.stats?.pending || 0}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {module.name === 'Sales Orders' ? 'In Progress' : 'Approved'}:{' '}
                        {module.stats?.approved || module.stats?.inProgress || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
