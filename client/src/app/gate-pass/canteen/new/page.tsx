'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

interface ProductItem {
  productName: string
  quantity: number
  amount: number
}

export default function NewCanteenGatePassPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [buyer, setBuyer] = useState('')
  const [products, setProducts] = useState<ProductItem[]>([
    { productName: '', quantity: 1, amount: 0 },
  ])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  const addProduct = () => {
    setProducts([...products, { productName: '', quantity: 1, amount: 0 }])
  }

  const removeProduct = (index: number) => {
    if (products.length <= 1) return
    setProducts(products.filter((_, i) => i !== index))
  }

  const updateProduct = (index: number, field: keyof ProductItem, value: string | number) => {
    const updated = [...products]
    ;(updated[index] as any)[field] = typeof value === 'string' ? value : Number(value) || 0
    setProducts(updated)
  }

  const totalAmount = products.reduce((sum, p) => sum + (p.quantity * p.amount || 0), 0)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!buyer.trim()) {
      toast.error('Buyer name is required')
      return
    }
    const validProducts = products.filter((p) => p.productName.trim() && (p.amount > 0 || p.quantity > 0))
    if (validProducts.length === 0) {
      toast.error('Add at least one product with name and amount')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/gate-pass', {
        type: 'canteen',
        buyer: buyer.trim(),
        products: validProducts.map((p) => ({
          productName: p.productName.trim(),
          quantity: Number(p.quantity) || 1,
          amount: Number(p.amount) || 0,
        })),
      })
      toast.success('Canteen gate pass created')
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">New Canteen Gate Pass</h1>

          <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Initiator: <span className="font-medium text-gray-900 dark:text-white">{user?.staffId}</span>
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buyer <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Staff name"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Products</h3>
                <button
                  type="button"
                  onClick={addProduct}
                  className="bg-primary-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-3">
                {products.map((p, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <input
                      type="text"
                      value={p.productName}
                      onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                      placeholder="Product name"
                      className="flex-1 min-w-[120px] px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <input
                      type="number"
                      min={1}
                      value={p.quantity || ''}
                      onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={p.amount || ''}
                      onChange={(e) => updateProduct(index, 'amount', e.target.value)}
                      placeholder="Amount (RWF)"
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeProduct(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right font-semibold text-gray-900 dark:text-white">
                Total: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'RWF' }).format(totalAmount)}
              </p>
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
