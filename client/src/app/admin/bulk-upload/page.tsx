'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Upload, Users, Package, Building2, FileJson, Download } from 'lucide-react'

type Tab = 'users' | 'customers' | 'products'

export default function BulkUploadPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('users')
  const [jsonInput, setJsonInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ created: number; errors: any[] } | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (!loading && user?.role !== 'administrator') {
      toast.error('Administrator access required')
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleUpload = async () => {
    let data: any[]
    try {
      data = JSON.parse(jsonInput)
      if (!Array.isArray(data) || data.length === 0) {
        toast.error('JSON must be a non-empty array')
        return
      }
    } catch {
      toast.error('Invalid JSON')
      return
    }

    setUploading(true)
    setResult(null)
    try {
      if (activeTab === 'users') {
        const res = await api.post('/users/bulk-upload', { users: data })
        setResult({
          created: res.data.created?.length ?? 0,
          errors: res.data.errors ?? [],
        })
        toast.success(`Created ${res.data.created?.length ?? 0} users`)
      } else if (activeTab === 'customers') {
        const res = await api.post('/sales/customers/bulk-upload', { customers: data })
        setResult({
          created: res.data.created?.length ?? 0,
          errors: res.data.errors ?? [],
        })
        toast.success(`Created ${res.data.created?.length ?? 0} customers`)
      } else {
        const res = await api.post('/sales/products/bulk-upload', { products: data })
        setResult({
          created: res.data.created?.length ?? 0,
          errors: res.data.errors ?? [],
        })
        toast.success(`Created ${res.data.created?.length ?? 0} products`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed')
      setResult(null)
    } finally {
      setUploading(false)
    }
  }

  const sampleUsers = [
    {
      staffId: 'EMP001',
      email: 'john@inyange.com',
      password: 'ChangeMe123',
      phoneNumber: '+250788123456',
      department: 'Finance',
      position: 'Accountant',
      role: 'user',
    },
  ]

  const sampleCustomers = [
    {
      customerNumber: 'CUST001',
      customerName: 'Ministry of Health',
      type: 'Government',
      contactPerson: 'Jane Doe',
      email: 'procurement@health.gov',
      phone: '+250788000001',
      address: 'Kigali',
    },
  ]

  const sampleProducts = [
    {
      productCode: 'MILK-001',
      productName: 'Fresh Milk 1L',
      category: 'Dairy',
      unit: 'pcs',
      description: '1 Liter pack',
    },
  ]

  const getSample = () => {
    if (activeTab === 'users') return JSON.stringify(sampleUsers, null, 2)
    if (activeTab === 'customers') return JSON.stringify(sampleCustomers, null, 2)
    return JSON.stringify(sampleProducts, null, 2)
  }

  const loadSample = () => setJsonInput(getSample())

  const downloadTemplate = () => {
    const blob = new Blob([getSample()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inyange-bulk-${activeTab}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (user.role !== 'administrator') return null

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'users', label: 'Users (Staff logins)', icon: Users },
    { id: 'customers', label: 'Customers', icon: Building2 },
    { id: 'products', label: 'Products', icon: Package },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Bulk Upload</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Upload users (for staff logins), customers, or products as JSON. Use the sample format below.
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setResult(null)
                    setJsonInput('')
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                JSON array (paste or edit)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadSample}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <FileJson className="h-4 w-4" />
                  Load sample
                </button>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Download className="h-4 w-4" />
                  Download template
                </button>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 font-mono text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder={`Paste JSON array of ${activeTab}...`}
            />

            {activeTab === 'users' && (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <strong>User object fields:</strong> staffId (required), email (optional), password (default
                &quot;ChangeMe123&quot;), phoneNumber (required), department (required), position (required),
                role (&quot;user&quot; or &quot;administrator&quot;).
              </div>
            )}
            {activeTab === 'customers' && (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <strong>Customer object fields:</strong> customerNumber (required), customerName (required), type
                (optional), contactPerson, email, phone, address.
              </div>
            )}
            {activeTab === 'products' && (
              <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                <strong>Product object fields:</strong> productCode (required), productName (required), category
                (optional: Dairy, Juice, Yoghurt, Ghee, Butter, Cheese, Other), unit (default &quot;pcs&quot;),
                description.
              </div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !jsonInput.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              {uploading ? 'Uploading...' : `Upload ${activeTab}`}
            </button>

            {result && (
              <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <p className="font-medium text-gray-900 dark:text-white">
                  Created: {result.created} | Errors: {result.errors.length}
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                    {result.errors.slice(0, 10).map((err: any, i: number) => (
                      <li key={i}>
                        {err.data?.staffId ?? err.data?.customerNumber ?? err.data?.productCode ?? JSON.stringify(err.data)}: {err.error}
                      </li>
                    ))}
                    {result.errors.length > 10 && (
                      <li>... and {result.errors.length - 10} more</li>
                    )}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
