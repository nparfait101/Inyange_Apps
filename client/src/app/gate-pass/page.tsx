'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'
import { Plus, Eye } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function GatePassPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [gatePasses, setGatePasses] = useState<any[]>([])
  const [fetching, setFetching] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'canteen' | 'general'>('all')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchGatePasses()
    }
  }, [user, activeTab])

  const fetchGatePasses = async () => {
    try {
      const response = await api.get('/gate-pass')
      let data = response.data
      if (activeTab !== 'all') {
        data = data.filter((gp: any) => gp.type === activeTab)
      }
      setGatePasses(data)
    } catch (error) {
      toast.error('Failed to fetch gate passes')
    } finally {
      setFetching(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Approved</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Rejected</span>
      default:
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">Pending</span>
    }
  }

  if (loading || fetching) {
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gate Pass</h1>
            <div className="flex space-x-2">
              <Link
                href="/gate-pass/canteen/new"
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>New Canteen</span>
              </Link>
              <Link
                href="/gate-pass/general/new"
                className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>New General</span>
              </Link>
            </div>
          </div>

          <div className="mb-4 flex space-x-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('canteen')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'canteen'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Canteen
            </button>
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 rounded-lg ${
                activeTab === 'general'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              General
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Initiator
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {gatePasses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        No gate passes found
                      </td>
                    </tr>
                  ) : (
                    gatePasses.map((gatePass) => (
                      <tr key={gatePass._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                            {gatePass.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {gatePass.type === 'canteen' ? (
                            <div className="text-sm text-gray-900 dark:text-white">
                              Buyer: {gatePass.buyer}
                              <br />
                              Total: {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'RWF',
                              }).format(gatePass.totalAmount || 0)}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900 dark:text-white">
                              Transporter: {gatePass.transporterName}
                              <br />
                              Destination: {gatePass.destination}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {gatePass.initiatorName || gatePass.initiator?.staffId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(gatePass.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {format(new Date(gatePass.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Link
                            href={`/gate-pass/${gatePass._id}`}
                            className="text-primary-600 hover:text-primary-900 dark:text-primary-400"
                          >
                            <Eye className="h-5 w-5 inline" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
