'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  FileText,
  Scale,
  Shield
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Order {
  _id: string
  orderNumber: string
  customerName: string
  customerNumber: string
  poNumber?: string
  totalAmount: number
  currency: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  currentStep: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  updatedAt: string
  workflow: Array<{
    step: number
    stepName: string
    status: 'pending' | 'in_progress' | 'completed' | 'rejected'
    updatedBy?: string
    updatedByName?: string
    updatedAt: string
    documentNumber?: string
  }>
}

const workflowSteps = [
  { step: 1, name: 'Sales Order', icon: FileText, color: 'text-blue-600' },
  { step: 2, name: 'Loading', icon: Package, color: 'text-green-600' },
  { step: 3, name: 'Delivery', icon: Truck, color: 'text-purple-600' },
  { step: 4, name: 'Invoice', icon: FileText, color: 'text-orange-600' },
  { step: 5, name: 'Gate 1', icon: Shield, color: 'text-indigo-600' },
  { step: 6, name: 'Weighbridge', icon: Scale, color: 'text-red-600' },
  { step: 7, name: 'Gate 2', icon: Shield, color: 'text-teal-600' }
]

export default function OrdersPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, page, searchTerm, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await api.get(`/orders?${params}`)
      setOrders(response.data.orders)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoadingOrders(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getWorkflowStepStatus = (workflow: any[], step: number) => {
    const stepData = workflow.find(w => w.step === step)
    return stepData?.status || 'pending'
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />
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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Orders Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Track and manage sales orders through the complete workflow</p>
            </div>
            <button
              onClick={() => router.push('/orders/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Create Order</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 dark:text-white">
                  <Filter className="h-5 w-5" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No orders found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by creating your first order</p>
                <button
                  onClick={() => router.push('/orders/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span>Create Order</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Workflow Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.orderNumber}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(order.priority)}`}>
                                {order.priority}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {order.customerName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {order.customerNumber}
                            </div>
                            {order.poNumber && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                PO: {order.poNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {order.currency} {order.totalAmount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            {workflowSteps.map((step) => {
                              const status = getWorkflowStepStatus(order.workflow, step.step)
                              const Icon = step.icon
                              return (
                                <div key={step.step} className="flex flex-col items-center">
                                  <div className={`p-1 rounded ${status === 'completed' ? 'bg-green-100' : status === 'in_progress' ? 'bg-blue-100' : status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'}`}>
                                    <Icon className={`h-4 w-4 ${step.color}`} />
                                  </div>
                                  <div className="mt-1">
                                    {getStepIcon(status)}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => router.push(`/orders/${order._id}`)}
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => router.push(`/orders/${order._id}/edit`)}
                              className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            {order.status === 'pending' && (
                              <button
                                onClick={() => {
                                  // Handle delete
                                  if (confirm('Are you sure you want to delete this order?')) {
                                    // Delete logic here
                                  }
                                }}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing page <span className="font-medium">{page}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === i + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
