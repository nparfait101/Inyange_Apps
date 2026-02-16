'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

interface ProductLine {
  productCode: string
  productName: string
  quantity: number
  unit: string
}

export default function NewSalesOrderPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [clientName, setClientName] = useState('')
  const [customerNumber, setCustomerNumber] = useState('')
  const [poNumber, setPoNumber] = useState('')
  const [productLines, setProductLines] = useState<ProductLine[]>([
    { productCode: '', productName: '', quantity: 1, unit: 'pcs' },
  ])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  useEffect(() => {
    const hasAccess =
      user?.role === 'administrator' ||
      user?.department === 'Commercial' ||
      user?.department === 'Inventory' ||
      user?.department === 'Finance' ||
      user?.permissions?.canAccessSales
    if (!hasAccess) return
    Promise.all([
      api.get('/sales/customers/list').then((r) => setCustomers(r.data)),
      api.get('/sales/products/list').then((r) => setProducts(r.data)),
    ]).catch(() => toast.error('Failed to load customers/products'))
  }, [user])

  const addProductLine = () => {
    setProductLines([...productLines, { productCode: '', productName: '', quantity: 1, unit: 'pcs' }])
  }

  const removeProductLine = (index: number) => {
    if (productLines.length <= 1) return
    setProductLines(productLines.filter((_, i) => i !== index))
  }

  const updateProductLine = (index: number, field: keyof ProductLine, value: string | number) => {
    const updated = [...productLines]
    ;(updated[index] as any)[field] = value
    if (field === 'productCode' || field === 'productName') {
      const product = products.find(
        (p) => p.productCode === value || p.productName === value
      )
      if (product) {
        updated[index].productCode = product.productCode
        updated[index].productName = product.productName
      }
    }
    setProductLines(updated)
  }

  const onCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === '') {
      setCustomerNumber('')
      setClientName('')
      return
    }
    const cust = customers.find((c) => c.customerNumber === val)
    if (cust) {
      setCustomerNumber(cust.customerNumber)
      setClientName(cust.customerName)
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clientName.trim()) {
      toast.error('Client name is required')
      return
    }
    const validLines = productLines.filter(
      (l) => l.productName && l.quantity > 0
    )
    if (validLines.length === 0) {
      toast.error('Add at least one product with quantity')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/sales', {
        clientName: clientName.trim(),
        customerNumber: customerNumber || undefined,
        poNumber: poNumber.trim() || undefined,
        products: validLines.map((l) => ({
          productCode: l.productCode,
          productName: l.productName,
          quantity: Number(l.quantity),
          unit: l.unit || 'pcs',
        })),
      })
      toast.success('Sales order created')
      router.push('/sales')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Create Sales Order</h1>

          <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer (optional – select to auto-fill)
                </label>
                <select
                  onChange={onCustomerSelect}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">-- Select customer --</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c.customerNumber}>
                      {c.customerName} (#{c.customerNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Client Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Client / company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Customer Number (SAP)
                </label>
                <input
                  type="text"
                  value={customerNumber}
                  onChange={(e) => setCustomerNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="From SAP if available"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PO Number (optional)
                </label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Products & Quantities</h3>
                <button
                  type="button"
                  onClick={addProductLine}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add product</span>
                </button>
              </div>
              <div className="space-y-3">
                {productLines.map((line, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <select
                      value={line.productCode || line.productName}
                      onChange={(e) => {
                        const p = products.find(
                          (x) => x.productCode === e.target.value || x.productName === e.target.value
                        )
                        if (p) {
                          updateProductLine(index, 'productCode', p.productCode)
                          updateProductLine(index, 'productName', p.productName)
                        }
                      }}
                      className="flex-1 min-w-[180px] px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">-- Select product --</option>
                      {products.map((p) => (
                        <option key={p._id} value={p.productCode}>
                          {p.productName} (#{p.productCode})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateProductLine(index, 'quantity', Number(e.target.value) || 1)}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Qty"
                    />
                    <span className="text-gray-500 dark:text-gray-400 text-sm">{line.unit}</span>
                    <button
                      type="button"
                      onClick={() => removeProductLine(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
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
                {submitting ? 'Creating...' : 'Submit Order'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
