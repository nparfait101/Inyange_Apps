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
  Download,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Calendar,
  Printer,
} from 'lucide-react'
import api from '@/lib/api'
import { printPOSReceipt, downloadPOSReceipt } from '@/lib/posGenerator'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<any>({})
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null)

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
          data: travelData,
        },
        fuel: {
          total: fuelData.length,
          pending: fuelData.filter((r: any) => r.status === 'pending').length,
          approved: fuelData.filter((r: any) => r.status === 'approved' || r.status === 'served').length,
          data: fuelData,
        },
        pettyCash: {
          total: pettyCashData.length,
          pending: pettyCashData.filter((r: any) => r.status === 'pending').length,
          approved: pettyCashData.filter((r: any) => r.status === 'approved' || r.status === 'paid').length,
          data: pettyCashData,
        },
        sales: {
          total: salesData.length,
          pending: salesData.filter((r: any) => r.status === 'pending').length,
          inProgress: salesData.filter((r: any) => r.status === 'in-progress').length,
          data: salesData,
        },
        gatePass: {
          total: gatePassData.length,
          pending: gatePassData.filter((r: any) => r.status === 'pending').length,
          approved: gatePassData.filter((r: any) => r.status === 'approved').length,
          data: gatePassData,
        },
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handlePrintPOS = async (moduleName: string, record: any) => {
    try {
      setDownloadLoading(`print-${record._id}`)
      
      const posData = {
        recordId: record._id?.toString().slice(-8) || record.id || 'N/A',
        title: `${moduleName} - ${record.title || record.purpose || record.description || 'N/A'}`,
        description: record.description || record.purpose || record.destination || 'Request Details',
        amount: record.amount || record.totalAmount,
        status: record.status || 'pending',
        createdAt: record.createdAt || new Date().toISOString(),
        user: user ? {
          staffId: user.staffId,
          department: user.department,
          position: user.position || 'Staff',
        } : undefined,
        items: record.items || [],
      }
      
      await printPOSReceipt(posData)
      toast.success('POS Receipt sent to printer')
    } catch (error) {
      console.error('Error printing POS:', error)
      toast.error('Failed to print POS receipt')
    } finally {
      setDownloadLoading(null)
    }
  }

  const handleDownloadPOS = async (moduleName: string, record: any) => {
    try {
      setDownloadLoading(`download-${record._id}`)
      
      const posData = {
        recordId: record._id?.toString().slice(-8) || record.id || 'N/A',
        title: `${moduleName} - ${record.title || record.purpose || record.description || 'N/A'}`,
        description: record.description || record.purpose || record.destination || 'Request Details',
        amount: record.amount || record.totalAmount,
        status: record.status || 'pending',
        createdAt: record.createdAt || new Date().toISOString(),
        user: user ? {
          staffId: user.staffId,
          department: user.department,
          position: user.position || 'Staff',
        } : undefined,
        items: record.items || [],
      }
      
      await downloadPOSReceipt(posData)
      toast.success('POS Receipt downloaded')
    } catch (error) {
      console.error('Error downloading POS:', error)
      toast.error('Failed to download POS receipt')
    } finally {
      setDownloadLoading(null)
    }
  }

  const generatePODocument = (moduleName: string, moduleData: any[]) => {
    if (!moduleData || moduleData.length === 0) {
      toast.error(`No records found for ${moduleName}`)
      return
    }

    // Create a simple HTML document for PO/Report
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${moduleName} - Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0079e6; padding-bottom: 20px; }
          .header h1 { color: #0079e6; margin: 0 0 5px 0; }
          .header p { color: #666; margin: 5px 0; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 15px; background: #f9f9f9; border-radius: 6px; }
          .meta-item { }
          .meta-label { font-weight: bold; color: #333; font-size: 12px; text-transform: uppercase; }
          .meta-value { color: #0079e6; font-size: 18px; font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #0079e6; color: white; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 12px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f9f9f9; }
          .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
          .status.approved { background: #d4edda; color: #155724; }
          .status.pending { background: #fff3cd; color: #856404; }
          .status.paid, .status.served { background: #d1ecf1; color: #0c5460; }
          .summary { margin-top: 30px; padding: 20px; background: #f0f7ff; border-left: 4px solid #0079e6; border-radius: 4px; }
          .summary h3 { color: #0079e6; margin-top: 0; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>InyangeApps - ${moduleName}</h1>
            <p>Generated Report</p>
          </div>
          
          <div class="meta">
            <div class="meta-item">
              <div class="meta-label">Generated By</div>
              <div class="meta-value">${user?.staffId || 'System'}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Department</div>
              <div class="meta-value">${user?.department || 'N/A'}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Total Records</div>
              <div class="meta-value">${moduleData.length}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Generated Date</div>
              <div class="meta-value">${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${moduleData.map((record: any) => `
                <tr>
                  <td>${record._id?.toString().slice(-6).toUpperCase() || record.id || 'N/A'}</td>
                  <td>${record.title || record.purpose || record.description || 'N/A'}</td>
                  <td><span class="status ${record.status}">${record.status?.toUpperCase() || 'N/A'}</span></td>
                  <td>${new Date(record.createdAt || record.date).toLocaleDateString()}</td>
                  <td>${record.amount ? '₦' + record.amount.toLocaleString() : record.totalAmount ? '₦' + record.totalAmount.toLocaleString() : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Records:</strong> ${moduleData.length}</p>
            <p><strong>Total Amount:</strong> ₦${moduleData.reduce((sum: number, r: any) => sum + (r.amount || r.totalAmount || 0), 0).toLocaleString()}</p>
            <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="footer">
            <p>This is an automatically generated report from InyangeApps System</p>
            <p>&copy; ${new Date().getFullYear()} Inyange Logistics Limited. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Create and trigger download
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${moduleName.replace(/\s+/g, '_')}_Report_${new Date().getTime()}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success(`${moduleName} report downloaded successfully`)
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
      color: 'from-blue-500 to-blue-600',
      lightColor: 'bg-blue-50 dark:bg-blue-900/20',
      stats: stats.travel,
    },
    {
      name: 'Fuel & Vehicle',
      href: '/fuel',
      icon: Fuel,
      color: 'from-green-500 to-green-600',
      lightColor: 'bg-green-50 dark:bg-green-900/20',
      stats: stats.fuel,
    },
    {
      name: 'Petty Cash',
      href: '/petty-cash',
      icon: DollarSign,
      color: 'from-yellow-500 to-yellow-600',
      lightColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      stats: stats.pettyCash,
    },
    ...(hasSalesAccess
      ? [
          {
            name: 'Sales Orders',
            href: '/sales',
            icon: ShoppingCart,
            color: 'from-purple-500 to-purple-600',
            lightColor: 'bg-purple-50 dark:bg-purple-900/20',
            stats: stats.sales,
          },
        ]
      : []),
    {
      name: 'Gate Pass',
      href: '/gate-pass',
      icon: Shield,
      color: 'from-indigo-500 to-indigo-600',
      lightColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      stats: stats.gatePass,
    },
  ]

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                  <span>Welcome back,</span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">{user.staffId}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-end space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </p>
              </div>
            </div>
            <div className="h-1 w-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
          </div>

          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {modules.map((module) => (
              <div key={module.name} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs font-medium mb-1">{module.name}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{module.stats?.total || 0}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${module.color} p-3 rounded-lg`}>
                    {module.icon && <module.icon className="h-6 w-6 text-white" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Module Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {modules.map((module) => {
              const Icon = module.icon
              return (
                <div
                  key={module.href}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Card Header */}
                  <div className={`bg-gradient-to-r ${module.color} p-6 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 opacity-10">
                      <Icon className="h-24 w-24" />
                    </div>
                    <div className="relative z-10">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-lg">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-bold">{module.name}</h3>
                      </div>
                      <p className="text-sm text-white/80">Total Records: <span className="font-bold text-2xl">{module.stats?.total || 0}</span></p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Pending</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{module.stats?.pending || 0}</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            {module.name === 'Sales Orders' ? 'In Progress' : 'Approved'}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          {module.stats?.approved || module.stats?.inProgress || 0}
                        </p>
                      </div>
                    </div>

                    {/* Trend Indicator */}
                    {module.stats?.total > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Completion Rate</span>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                              {Math.round(((module.stats?.approved || module.stats?.inProgress || 0) / module.stats?.total) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`bg-gradient-to-r ${module.color} h-2 rounded-full transition-all duration-500`}
                            style={{
                              width: `${Math.round(((module.stats?.approved || module.stats?.inProgress || 0) / module.stats?.total) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href={module.href}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium text-sm"
                      >
                        <span>View All</span>
                      </Link>
                      
                      {/* Print Latest POS Button */}
                      {module.stats?.data && module.stats.data.length > 0 && (
                        <button
                          onClick={() => handlePrintPOS(module.name, module.stats.data[0])}
                          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                          disabled={downloadLoading?.startsWith('print')}
                          title="Print latest POS receipt"
                        >
                          <Printer className="h-4 w-4" />
                          <span className="hidden sm:inline">{downloadLoading?.startsWith('print') ? 'Printing...' : 'Print'}</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => generatePODocument(module.name, module.stats?.data || [])}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                        disabled={downloadLoading === module.name}
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">{downloadLoading === module.name ? 'Downloading...' : 'Report'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
