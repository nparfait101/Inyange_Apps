'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function TravelDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user, loading } = useAuth()
  const [request, setRequest] = useState<any>(null)
  const [fetching, setFetching] = useState(true)
  const [approving, setApproving] = useState(false)
  const [stepToApprove, setStepToApprove] = useState<number | null>(null)
  const [approvalComment, setApprovalComment] = useState('')
  const [markingPaid, setMarkingPaid] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user && id) fetchRequest()
  }, [user, id])

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/travel/${id}`)
      setRequest(res.data)
    } catch (error) {
      toast.error('Failed to load travel request')
      router.push('/travel')
    } finally {
      setFetching(false)
    }
  }

  const handleApprove = async (stepNumber: number, status: 'approved' | 'rejected') => {
    setApproving(true)
    try {
      await api.put(`/travel/${id}/approve`, {
        stepNumber,
        status,
        comments: approvalComment,
      })
      toast.success(status === 'approved' ? 'Approved' : 'Rejected')
      setStepToApprove(null)
      setApprovalComment('')
      fetchRequest()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed')
    } finally {
      setApproving(false)
    }
  }

  const handleMarkPaid = async () => {
    setMarkingPaid(true)
    try {
      await api.put(`/travel/${id}/mark-paid`)
      toast.success('Marked as Paid')
      fetchRequest()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed')
    } finally {
      setMarkingPaid(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Approved</span>
      case 'paid':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">Paid</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Rejected</span>
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Pending</span>
    }
  }

  const isApprover = (email: string) =>
    user?.email?.toLowerCase() === email?.toLowerCase() || user?.role === 'administrator'
  const canMarkPaid =
    (user?.department === 'Finance' && (user?.permissions?.canMarkPaid || user?.role === 'administrator')) ||
    user?.role === 'administrator'

  if (loading || fetching || !request) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/travel"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Travel Requests
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Travel Request Details</h1>
              {getStatusBadge(request.status)}
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Employee Name</label>
                  <p className="font-medium text-gray-900 dark:text-white">{request.employeeName}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Position</label>
                  <p className="font-medium text-gray-900 dark:text-white">{request.position}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Grade</label>
                  <p className="font-medium text-gray-900 dark:text-white">{request.grade}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Department</label>
                  <p className="font-medium text-gray-900 dark:text-white">{request.department}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Travel Purpose</label>
                  <p className="font-medium text-gray-900 dark:text-white">{request.travelPurpose}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Travel Type</label>
                  <p className="font-medium text-gray-900 dark:text-white">{request.travelType}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Financing Company</label>
                  <p className="font-medium text-gray-900 dark:text-white">{request.financingCompany}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Dates</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(request.dateOfDeparture), 'MMM dd, yyyy')} –{' '}
                    {format(new Date(request.dateOfReturn), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Requested By</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {request.requestedBy?.staffId} ({request.requestedBy?.department})
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Created</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(request.createdAt), 'PPp')}
                  </p>
                </div>
                {request.status === 'paid' && request.paidAt && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400">Paid</label>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(request.paidAt), 'PPp')}
                      {request.paidBy && ` by ${request.paidBy.staffId}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Approval Flow */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Approval Flow</h3>
                <div className="space-y-2">
                  {request.approvalFlow?.map((step: any) => (
                    <div
                      key={step.stepNumber}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                    >
                      <div className="flex items-center space-x-3">
                        {step.status === 'approved' ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : step.status === 'rejected' ? (
                          <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            Step {step.stepNumber}: {step.approverEmail}
                          </span>
                          <span className="ml-2">{getStatusBadge(step.status)}</span>
                          {step.approvedAt && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {step.approverName} – {format(new Date(step.approvedAt), 'PPp')}
                              {step.comments && ` – ${step.comments}`}
                            </p>
                          )}
                        </div>
                      </div>
                      {step.status === 'pending' &&
                        isApprover(step.approverEmail) &&
                        request.status === 'pending' && (
                          <div className="flex items-center space-x-2">
                            {stepToApprove === step.stepNumber ? (
                              <>
                                <input
                                  type="text"
                                  placeholder="Comment (optional)"
                                  value={approvalComment}
                                  onChange={(e) => setApprovalComment(e.target.value)}
                                  className="px-3 py-1 border rounded text-sm"
                                />
                                <button
                                  onClick={() => handleApprove(step.stepNumber, 'approved')}
                                  disabled={approving}
                                  className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApprove(step.stepNumber, 'rejected')}
                                  disabled={approving}
                                  className="px-3 py-1 bg-red-600 text-white rounded text-sm"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => {
                                    setStepToApprove(null)
                                    setApprovalComment('')
                                  }}
                                  className="px-3 py-1 border rounded text-sm"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setStepToApprove(step.stepNumber)}
                                className="px-3 py-1 bg-primary-500 text-white rounded text-sm"
                              >
                                Approve / Reject
                              </button>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mark as Paid (Finance) */}
              {request.status === 'approved' && canMarkPaid && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <button
                    onClick={handleMarkPaid}
                    disabled={markingPaid}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    {markingPaid ? 'Marking...' : 'Mark as Paid'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
