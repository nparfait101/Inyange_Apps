'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STEP_NEEDS_DOCUMENT: Record<number, string> = {
  1: 'Sales Order Number',
  2: '', // Loading – can add comment
  3: 'Delivery Number',
  4: 'Invoice Number (with EBM if applicable)',
  5: '',
  6: '', // Weighbridge – approve/reject
  7: '',
}

export default function SalesOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user, loading } = useAuth()
  const [order, setOrder] = useState<any>(null)
  const [fetching, setFetching] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [documentNumber, setDocumentNumber] = useState('')
  const [comments, setComments] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user && id) fetchOrder()
  }, [user, id])

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/sales/${id}`)
      setOrder(res.data)
    } catch (error) {
      toast.error('Failed to load sales order')
      router.push('/sales')
    } finally {
      setFetching(false)
    }
  }

  const hasSalesAccess =
    user?.role === 'administrator' ||
    user?.department === 'Commercial' ||
    user?.department === 'Inventory' ||
    user?.department === 'Finance' ||
    user?.permissions?.canAccessSales

  const currentStepIndex = order?.workflow?.findIndex((s: any) => s.status === 'pending') ?? -1
  const nextPendingStep = currentStepIndex >= 0 ? order?.workflow?.[currentStepIndex] : null

  const handleCompleteStep = async (stepNumber: number, status: 'completed' | 'rejected' = 'completed') => {
    const step = order?.workflow?.find((s: any) => s.stepNumber === stepNumber)
    if (!step || step.status !== 'pending') return
    if (status === 'completed' && STEP_NEEDS_DOCUMENT[stepNumber] && [1, 3, 4].includes(stepNumber)) {
      if (!documentNumber.trim()) {
        toast.error('Document number is required')
        return
      }
    }

    setUpdating(true)
    try {
      await api.put(`/sales/${id}/update-step`, {
        stepNumber,
        status,
        documentNumber: documentNumber.trim() || undefined,
        comments: comments.trim() || undefined,
      })
      toast.success(status === 'rejected' ? 'Step rejected' : 'Step updated')
      setActiveStep(null)
      setDocumentNumber('')
      setComments('')
      setRejectMode(false)
      fetchOrder()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Completed</span>
      case 'in-progress':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">In Progress</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Rejected</span>
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Pending</span>
    }
  }

  if (loading || fetching || !order) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!user || !hasSalesAccess) return null

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/sales"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales Orders
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center flex-wrap gap-2">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sales Order Details</h1>
              {getStatusBadge(order.status)}
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Client</label>
                  <p className="font-medium text-gray-900 dark:text-white">{order.clientName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Customer Number (SAP)</label>
                  <p className="font-medium text-gray-900 dark:text-white">{order.customerNumber || '–'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">PO Number</label>
                  <p className="font-medium text-gray-900 dark:text-white">{order.poNumber || '–'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Created By</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.createdByName} at {format(new Date(order.createdAt), 'PPp')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Products</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-gray-600">
                        <th className="text-left py-2 text-gray-500 dark:text-gray-400">Product</th>
                        <th className="text-right py-2 text-gray-500 dark:text-gray-400">Quantity</th>
                        <th className="text-left py-2 text-gray-500 dark:text-gray-400">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.products?.map((p: any, i: number) => (
                        <tr key={i} className="border-b dark:border-gray-700">
                          <td className="py-2 text-gray-900 dark:text-white">
                            {p.productName} {p.productCode && `(#${p.productCode})`}
                          </td>
                          <td className="py-2 text-right">{p.quantity}</td>
                          <td className="py-2">{p.unit || 'pcs'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Workflow</h3>
                <div className="space-y-2">
                  {order.workflow?.map((step: any) => (
                    <div
                      key={step.stepNumber}
                      className={`p-3 rounded-lg border dark:border-gray-600 ${
                        step.status === 'completed'
                          ? 'bg-green-50 dark:bg-green-900/20'
                          : step.status === 'rejected'
                          ? 'bg-red-50 dark:bg-red-900/20'
                          : 'bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center space-x-3">
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                          ) : step.status === 'rejected' ? (
                            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              Step {step.stepNumber}: {step.stepName}
                            </span>
                            <span className="ml-2">{getStatusBadge(step.status)}</span>
                            {step.completedAt && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {step.completedByName} – {format(new Date(step.completedAt), 'PPp')}
                                {step.documentNumber && ` – ${step.documentNumber}`}
                                {step.comments && ` – ${step.comments}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {step.status === 'pending' &&
                          nextPendingStep?.stepNumber === step.stepNumber &&
                          order.status !== 'rejected' && (
                            <div className="flex flex-wrap items-center gap-2">
                              {activeStep !== step.stepNumber ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveStep(step.stepNumber)}
                                  className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600"
                                >
                                  Update this step
                                </button>
                              ) : (
                                <div className="flex flex-wrap items-end gap-2">
                                  {STEP_NEEDS_DOCUMENT[step.stepNumber] && (
                                    <div>
                                      <label className="block text-xs text-gray-500 dark:text-gray-400">
                                        {STEP_NEEDS_DOCUMENT[step.stepNumber]}
                                      </label>
                                      <input
                                        type="text"
                                        value={documentNumber}
                                        onChange={(e) => setDocumentNumber(e.target.value)}
                                        placeholder="Document number"
                                        className="px-3 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
                                      />
                                    </div>
                                  )}
                                  <input
                                    type="text"
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    placeholder="Comments (optional)"
                                    className="px-3 py-1.5 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
                                  />
                                  {step.stepNumber === 6 ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleCompleteStep(step.stepNumber, 'completed')}
                                        disabled={updating}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded text-sm"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCompleteStep(step.stepNumber, 'rejected')}
                                        disabled={updating}
                                        className="px-3 py-1.5 bg-red-600 text-white rounded text-sm"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleCompleteStep(step.stepNumber, 'completed')}
                                      disabled={updating}
                                      className="px-3 py-1.5 bg-green-600 text-white rounded text-sm"
                                    >
                                      Complete
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveStep(null)
                                      setDocumentNumber('')
                                      setComments('')
                                    }}
                                    className="px-3 py-1.5 border rounded text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.status === 'rejected' && order.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Rejection reason: {order.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
