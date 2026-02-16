'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'

export default function NewGeneralGatePassPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [transporterName, setTransporterName] = useState('')
  const [destination, setDestination] = useState('')
  const [itemsDescription, setItemsDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transporterName.trim()) {
      toast.error('Name of transporter is required')
      return
    }
    if (!itemsDescription.trim()) {
      toast.error('Description of items is required')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/gate-pass', {
        type: 'general',
        transporterName: transporterName.trim(),
        destination: destination.trim(),
        itemsDescription: itemsDescription.trim(),
      })
      toast.success('Gate pass created')
      router.push('/gate-pass')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create gate pass')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">New General Gate Pass</h1>

          <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Initiator: <span className="font-medium text-gray-900 dark:text-white">{user?.staffId}</span>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name of the Transporter <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Person carrying the items"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Where items are going"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What is taken out / Other explanations <span className="text-red-500">*</span>
              </label>
              <textarea
                value={itemsDescription}
                onChange={(e) => setItemsDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Describe items and reason"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Submit Gate Pass'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
