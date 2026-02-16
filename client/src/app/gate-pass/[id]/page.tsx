'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Shield } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function GatePassDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const { user, loading } = useAuth()
  const [gatePass, setGatePass] = useState<any>(null)
  const [fetching, setFetching] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<'approved' | 'rejected' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    if (user && id) fetchGatePass()
  }, [user, id])

  const fetchGatePass = async () => {
    try {
      const res = await api.get(`/gate-pass/${id}`)
      setGatePass(res.data)
    } catch (error) {
      toast.error('Failed to load gate pass')
      router.push('/gate-pass')
    } finally {
      setFetching(false)
    }
  }

  const handleVerify = async () => {
    if (!verifyStatus) return
    setVerifying(true)
    try {
      await api.put(`/gate-pass/${id}/verify`, {
        status: verifyStatus,
        rejectionReason: verifyStatus === 'rejected' ? rejectionReason : undefined,
      })
      toast.success(verifyStatus === 'approved' ? 'Gate pass approved' : 'Gate pass rejected')
      setVerifyStatus(null)
      setRejectionReason('')
      fetchGatePass()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Action failed')
    } finally {
      setVerifying(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">Rejected</span>
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">Pending</span>
    }
  }

  if (loading || fetching || !gatePass) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!user) return null

  const canVerify = gatePass.status === 'pending'

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-2xl mx-auto">
          <Link
            href="/gate-pass"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Gate Pass
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b dark:border-gray-700 flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                {gatePass.type} Gate Pass
              </h1>
              {getStatusBadge(gatePass.status)}
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Initiator</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {gatePass.initiatorName || gatePass.initiator?.staffId}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Created</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {format(new Date(gatePass.createdAt), 'PPp')}
                  </p>
                </div>

                {gatePass.type === 'canteen' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Buyer</label>
                      <p className="font-medium text-gray-900 dark:text-white">{gatePass.buyer}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Total Amount</label>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(
                          gatePass.totalAmount || 0
                        )}
                      </p>
                    </div>
                  </>
                )}

                {gatePass.type === 'general' && (
                  <>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Transporter</label>
                      <p className="font-medium text-gray-900 dark:text-white">{gatePass.transporterName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Destination</label>
                      <p className="font-medium text-gray-900 dark:text-white">{gatePass.destination || '–'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm text-gray-500 dark:text-gray-400">Items / Explanation</label>
                      <p className="font-medium text-gray-900 dark:text-white whitespace-pre-wrap">
                        {gatePass.itemsDescription}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {gatePass.type === 'canteen' && gatePass.products?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Products</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b dark:border-gray-600">
                        <th className="text-left py-2 text-gray-500 dark:text-gray-400">Product</th>
                        <th className="text-right py-2 text-gray-500 dark:text-gray-400">Qty</th>
                        <th className="text-right py-2 text-gray-500 dark:text-gray-400">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gatePass.products.map((p: any, i: number) => (
                        <tr key={i} className="border-b dark:border-gray-700">
                          <td className="py-2 text-gray-900 dark:text-white">{p.productName}</td>
                          <td className="py-2 text-right">{p.quantity}</td>
                          <td className="py-2 text-right">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(
                              p.amount || 0
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {gatePass.status !== 'pending' && gatePass.verifiedAt && (
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <label className="text-sm text-gray-500 dark:text-gray-400">Verified</label>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {gatePass.verifiedByName} – {format(new Date(gatePass.verifiedAt), 'PPp')}
                    {gatePass.rejectionReason && (
                      <span className="block text-red-600 dark:text-red-400 mt-1">
                        Reason: {gatePass.rejectionReason}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {canVerify && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Security verification
                  </h3>
                  {!verifyStatus ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setVerifyStatus('approved')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve / Give go ahead
                      </button>
                      <button
                        type="button"
                        onClick={() => setVerifyStatus('rejected')}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {verifyStatus === 'rejected' && (
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Rejection reason (optional)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleVerify}
                          disabled={verifying}
                          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                        >
                          {verifying ? 'Processing...' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVerifyStatus(null)
                            setRejectionReason('')
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
