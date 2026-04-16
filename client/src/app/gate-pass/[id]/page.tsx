'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Shield, Printer, Check } from 'lucide-react'
import api from '@/lib/api'
import { printPOSReceipt } from '@/lib/posGenerator'
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
  const [printLoading, setPrintLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

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

  const handlePrintPOS = async () => {
    setPrintLoading(true)
    try {
      // Print POS Receipt
      const posData = {
        recordId: gatePass._id?.toString().slice(-8) || 'N/A',
        title: `Gate Pass - ${gatePass.type.toUpperCase()}`,
        description: gatePass.type === 'canteen' 
          ? `Buyer: ${gatePass.buyer}` 
          : `Destination: ${gatePass.destination || 'N/A'} | Transporter: ${gatePass.transporterName || 'N/A'}`,
        amount: gatePass.totalAmount,
        status: gatePass.status,
        createdAt: gatePass.createdAt,
        user: user ? {
          staffId: user.staffId,
          department: user.department,
          position: user.position || 'Staff',
        } : undefined,
        items: gatePass.products || [],
      }

      await printPOSReceipt(posData)

      // Register print action in backend
      const res = await api.put(`/gate-pass/${id}/print`)
      setGatePass(res.data.gatePass)
      toast.success('POS printed and scanned successfully. Ready for checkout approval.')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to print POS')
    } finally {
      setPrintLoading(false)
    }
  }

  const handleCheckoutApproval = async () => {
    setCheckoutLoading(true)
    try {
      const res = await api.put(`/gate-pass/${id}/checkout-approve`)
      setGatePass(res.data.gatePass)
      toast.success('Gate pass approved and checked out successfully!')
    } catch (error: any) {
      if (error.response?.data?.code === 'PRINT_REQUIRED') {
        toast.error('Gate pass must be printed and scanned first')
      } else {
        toast.error(error.response?.data?.message || 'Checkout approval failed')
      }
    } finally {
      setCheckoutLoading(false)
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

  // Show approval for pending gate passes or if user is security/admin
  const canVerify = gatePass.status === 'pending' || user.role === 'administrator' || user.department === 'Security'

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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Gate Security Approval Process
                  </h3>

                  {/* Two-Step Approval Workflow */}
                  <div className="space-y-4">
                    {/* Step 1: Print & Scan */}
                    <div className="p-4 rounded-lg border-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-600">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${gatePass.printedAt ? 'bg-green-500' : 'bg-blue-500'}`}>
                            {gatePass.printedAt ? <Check className="h-5 w-5" /> : '1'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Step 1: Print & Scan Document</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Print POS receipt with QR code for verification</p>
                          </div>
                        </div>
                      </div>

                      {gatePass.printedAt ? (
                        <div className="ml-11 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center">
                            <Check className="h-4 w-4 mr-2" />
                            ✓ Document printed by {gatePass.printedByName} on {format(new Date(gatePass.printedAt), 'PPp')}
                          </p>
                          {gatePass.verificationCode && (
                            <p className="text-xs text-green-600 dark:text-green-300 mt-2 font-mono">
                              Verification Code: {gatePass.verificationCode}
                            </p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={handlePrintPOS}
                          disabled={printLoading}
                          className="ml-11 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          {printLoading ? 'Printing...' : 'Print & Scan Document'}
                        </button>
                      )}
                    </div>

                    {/* Step 2: Checkout Approval */}
                    <div className={`p-4 rounded-lg border-2 ${gatePass.printedAt ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300 dark:border-green-600' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600 opacity-50'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${gatePass.checkoutApprovedAt ? 'bg-green-500' : gatePass.printedAt ? 'bg-green-500' : 'bg-gray-400'}`}>
                            {gatePass.checkoutApprovedAt ? <Check className="h-5 w-5" /> : '2'}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">Step 2: Approve & Checkout</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Final approval after document is printed and verified</p>
                          </div>
                        </div>
                      </div>

                      {gatePass.checkoutApprovedAt ? (
                        <div className="ml-11 mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                          <p className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center">
                            <Check className="h-4 w-4 mr-2" />
                            ✓ Approved and checked out by {gatePass.checkoutApprovedByName} on {format(new Date(gatePass.checkoutApprovedAt), 'PPp')}
                          </p>
                        </div>
                      ) : gatePass.printedAt ? (
                        <button
                          onClick={handleCheckoutApproval}
                          disabled={checkoutLoading}
                          className="ml-11 mt-3 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {checkoutLoading ? 'Approving...' : 'Approve & Checkout'}
                        </button>
                      ) : (
                        <p className="ml-11 mt-3 text-sm text-gray-500 dark:text-gray-400">Complete Step 1 first</p>
                      )}
                    </div>
                  </div>

                  {/* Alternative: Quick Reject */}
                  <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Or reject this gate pass:</p>
                    {!verifyStatus ? (
                      <button
                        type="button"
                        onClick={() => setVerifyStatus('rejected')}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Gate Pass
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Rejection reason (required)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleVerify}
                            disabled={verifying || !rejectionReason}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {verifying ? 'Processing...' : 'Confirm Rejection'}
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
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
