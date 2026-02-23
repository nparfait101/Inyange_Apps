'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import {
  ArrowLeft,
  Package,
  User,
  FileText,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Scale,
  Shield,
  Edit,
  Save,
  X
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Order {
  _id: string
  orderNumber: string
  customer: {
    _id: string
    customerNumber: string
    customerName: string
    type: string
    email?: string
    phone?: string
    address?: string
  }
  poNumber?: string
  products: Array<{
    product: string
    productName: string
    productCode: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
  totalAmount: number
  currency: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  currentStep: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deliveryAddress?: string
  contactPerson?: string
  contactPhone?: string
  notes?: string
  expectedWeight?: number
  actualWeight?: number
  weightVariance?: number
  createdAt: string
  updatedAt: string
  createdBy: {
    _id: string
    name: string
    email: string
  }
  workflow: Array<{
    step: number
    stepName: string
    status: 'pending' | 'in_progress' | 'completed' | 'rejected'
    updatedBy?: {
      _id: string
      name: string
      email: string
    }
    updatedByName?: string
    updatedAt: string
    documentNumber?: string
    notes?: string
    rejectionReason?: string
  }>
}

const workflowSteps = [
  { step: 1, name: 'Sales Order', icon: FileText, color: 'text-blue-600', description: 'Create sales order in SAP' },
  { step: 2, name: 'Loading', icon: Package, color: 'text-green-600', description: 'Load products in warehouse' },
  { step: 3, name: 'Delivery', icon: Truck, color: 'text-purple-600', description: 'Deliver to customer' },
  { step: 4, name: 'Invoice', icon: FileText, color: 'text-orange-600', description: 'Create invoice in SAP' },
  { step: 5, name: 'Gate 1', icon: Shield, color: 'text-indigo-600', description: 'Exit gate 1 approval' },
  { step: 6, name: 'Weighbridge', icon: Scale, color: 'text-red-600', description: 'Weight verification' },
  { step: 7, name: 'Gate 2', icon: Shield, color: 'text-teal-600', description: 'Final exit approval' }
]

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loadingOrder, setLoadingOrder] = useState(true)
  const [updatingStep, setUpdatingStep] = useState<number | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  const [updateForm, setUpdateForm] = useState({
    status: 'completed' as 'pending' | 'in_progress' | 'completed' | 'rejected',
    documentNumber: '',
    notes: '',
    rejectionReason: '',
    actualWeight: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && params.id) {
      fetchOrder()
    }
  }, [user, params.id])

  const fetchOrder = async () => {
    try {
      setLoadingOrder(true)
      const response = await api.get(`/orders/${params.id}`)
      setOrder(response.data)
    } catch (error) {
      console.error('Error fetching order:', error)
      toast.error('Failed to fetch order')
      router.push('/orders')
    } finally {
      setLoadingOrder(false)
    }
  }

  const getWorkflowStepStatus = (workflow: any[], step: number) => {
    const stepData = workflow.find(w => w.step === step)
    return stepData?.status || 'pending'
  }

  const getWorkflowStepData = (workflow: any[], step: number) => {
    return workflow.find(w => w.step === step)
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />
      case 'rejected': return <XCircle className="h-5 w-5 text-red-600" />
      default: return <AlertCircle className="h-5 w-5 text-gray-400" />
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

  const handleStepUpdate = (step: number) => {
    setSelectedStep(step)
    const stepData = getWorkflowStepData(order?.workflow || [], step)
    setUpdateForm({
      status: stepData?.status || 'pending',
      documentNumber: stepData?.documentNumber || '',
      notes: stepData?.notes || '',
      rejectionReason: stepData?.rejectionReason || '',
      actualWeight: order?.actualWeight?.toString() || ''
    })
    setShowUpdateModal(true)
  }

  const submitStepUpdate = async () => {
    if (!selectedStep || !order) return

    try {
      setUpdatingStep(selectedStep)
      
      const updateData: any = {
        status: updateForm.status,
        documentNumber: updateForm.documentNumber || undefined,
        notes: updateForm.notes || undefined,
        rejectionReason: updateForm.rejectionReason || undefined
      }
      
      if (selectedStep === 6 && updateForm.actualWeight) {
        updateData.actualWeight = parseFloat(updateForm.actualWeight)
      }
      
      await api.patch(`/orders/${order._id}/workflow/${selectedStep}`, updateData)
      
      toast.success('Step updated successfully')
      setShowUpdateModal(false)
      fetchOrder() // Refresh order data
    } catch (error: any) {
      console.error('Error updating step:', error)
      toast.error(error.response?.data?.message || 'Failed to update step')
    } finally {
      setUpdatingStep(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user || !order) return null

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/orders')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{order.orderNumber}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Order Details & Workflow Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(order.priority)}`}>
                {order.priority}
              </span>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
                <p className="text-gray-900 dark:text-white font-medium">{order.customer.customerName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{order.customer.customerNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <p className="text-gray-900 dark:text-white">{order.customer.type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PO Number</label>
                <p className="text-gray-900 dark:text-white">{order.poNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label>
                <p className="text-gray-900 dark:text-white">{order.contactPerson || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Phone</label>
                <p className="text-gray-900 dark:text-white">{order.contactPhone || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Address</label>
                <p className="text-gray-900 dark:text-white">{order.deliveryAddress || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Order Items
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {order.products.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.productCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {order.currency} {item.unitPrice.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {order.currency} {item.totalPrice.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      Total Amount
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                      {order.currency} {order.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Workflow Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Workflow Progress</h2>
            <div className="space-y-4">
              {workflowSteps.map((step) => {
                const stepStatus = getWorkflowStepStatus(order.workflow, step.step)
                const stepData = getWorkflowStepData(order.workflow, step.step)
                const Icon = step.icon
                const isCurrentStep = order.currentStep === step.step
                const canUpdate = user.role === 'administrator' || 
                                (step.step === 1 && user.department === 'Commercial') ||
                                (step.step === 2 && user.department === 'Inventory') ||
                                (step.step === 3 && user.department === 'Logistics') ||
                                (step.step === 4 && user.department === 'Finance') ||
                                (step.step >= 5 && user.department === 'Security')

                return (
                  <div
                    key={step.step}
                    className={`border rounded-lg p-4 ${
                      isCurrentStep ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 
                      stepStatus === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                      stepStatus === 'rejected' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${stepStatus === 'completed' ? 'bg-green-100' : stepStatus === 'rejected' ? 'bg-red-100' : isCurrentStep ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <Icon className={`h-6 w-6 ${step.color}`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            Step {step.step}: {step.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {getStepIcon(stepStatus)}
                        {canUpdate && stepStatus !== 'completed' && (
                          <button
                            onClick={() => handleStepUpdate(step.step)}
                            disabled={updatingStep === step.step}
                            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                          >
                            {updatingStep === step.step ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {stepData && (
                      <div className="mt-3 pl-11">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {stepData.updatedByName && (
                            <span>Updated by {stepData.updatedByName}</span>
                          )}
                          {stepData.updatedAt && (
                            <span> • {new Date(stepData.updatedAt).toLocaleString()}</span>
                          )}
                        </div>
                        {stepData.documentNumber && (
                          <div className="text-sm text-gray-900 dark:text-white mt-1">
                            Document: {stepData.documentNumber}
                          </div>
                        )}
                        {stepData.notes && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Notes: {stepData.notes}
                          </div>
                        )}
                        {stepData.rejectionReason && (
                          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Rejection Reason: {stepData.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Weight Information */}
          {order.expectedWeight && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Scale className="h-5 w-5 mr-2" />
                Weight Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Weight</label>
                  <p className="text-gray-900 dark:text-white font-medium">{order.expectedWeight} kg</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Actual Weight</label>
                  <p className="text-gray-900 dark:text-white font-medium">{order.actualWeight || 'N/A'} kg</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Variance</label>
                  <p className={`font-medium ${order.weightVariance && Math.abs(order.weightVariance) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
                    {order.weightVariance ? `${order.weightVariance > 0 ? '+' : ''}${order.weightVariance} kg` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          {order.notes && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Additional Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300">{order.notes}</p>
            </div>
          )}

          {/* Order Metadata */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created By</label>
                <p className="text-gray-900 dark:text-white">{order.createdBy.name}</p>
                <p className="text-gray-500 dark:text-gray-400">{order.createdBy.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Created At</label>
                <p className="text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Updated</label>
                <p className="text-gray-900 dark:text-white">{new Date(order.updatedAt).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Step</label>
                <p className="text-gray-900 dark:text-white">Step {order.currentStep} of 7</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Update Modal */}
      {showUpdateModal && selectedStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Step {selectedStep}: {workflowSteps.find(s => s.step === selectedStep)?.name}
              </h3>
              <button
                onClick={() => setShowUpdateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={updateForm.status}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {selectedStep !== 6 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Document Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={updateForm.documentNumber}
                    onChange={(e) => setUpdateForm({ ...updateForm, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter document number"
                  />
                </div>
              )}

              {selectedStep === 6 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actual Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={updateForm.actualWeight}
                    onChange={(e) => setUpdateForm({ ...updateForm, actualWeight: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter actual weight"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={updateForm.notes}
                  onChange={(e) => setUpdateForm({ ...updateForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter notes"
                />
              </div>

              {updateForm.status === 'rejected' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={updateForm.rejectionReason}
                    onChange={(e) => setUpdateForm({ ...updateForm, rejectionReason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter rejection reason"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitStepUpdate}
                disabled={updatingStep === selectedStep || (updateForm.status === 'rejected' && !updateForm.rejectionReason)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updatingStep === selectedStep ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Update</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
