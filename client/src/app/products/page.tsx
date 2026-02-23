'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  Box,
  Tag
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Product {
  _id: string
  productCode: string
  productName: string
  category: 'Dairy' | 'Juice' | 'Yoghurt' | 'Ghee' | 'Butter' | 'Cheese' | 'Other'
  subCategory?: string
  brand?: string
  unit: string
  unitSize?: string
  unitWeight?: number
  description?: string
  standardPrice: number
  wholesalePrice?: number
  costPrice?: number
  currency: string
  vatRate: number
  barcode?: string
  currentStock: number
  minStockLevel: number
  maxStockLevel?: number
  status: 'Active' | 'Inactive' | 'Discontinued'
  isPerishable: boolean
  requiresRefrigeration: boolean
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function ProductsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user, page, searchTerm, categoryFilter, statusFilter])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter) params.append('category', categoryFilter)
      if (statusFilter) params.append('status', statusFilter)
      
      const response = await api.get(`/products?${params}`)
      setProducts(response.data.products)
      setTotalPages(response.data.pagination.pages)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Inactive': return 'bg-gray-100 text-gray-800'
      case 'Discontinued': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Dairy': return 'bg-blue-100 text-blue-800'
      case 'Juice': return 'bg-orange-100 text-orange-800'
      case 'Yoghurt': return 'bg-purple-100 text-purple-800'
      case 'Ghee': return 'bg-yellow-100 text-yellow-800'
      case 'Butter': return 'bg-pink-100 text-pink-800'
      case 'Cheese': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.currentStock <= product.minStockLevel) {
      return { color: 'text-red-600', status: 'Low Stock' }
    } else if (product.currentStock <= product.minStockLevel * 1.5) {
      return { color: 'text-yellow-600', status: 'Medium Stock' }
    } else {
      return { color: 'text-green-600', status: 'Good Stock' }
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      setUploading(true)
      const response = await api.post('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      toast.success(`Upload completed: ${response.data.success} successful, ${response.data.errors} failed`)
      setSelectedFile(null)
      fetchProducts()
    } catch (error: any) {
      console.error('Error uploading products:', error)
      toast.error(error.response?.data?.message || 'Failed to upload products')
    } finally {
      setUploading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/products/template/download', {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'products-template.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Failed to download template')
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      await api.delete(`/products/${id}`)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(error.response?.data?.message || 'Failed to delete product')
    }
  }

  if (loading) {
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
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your product catalog and bulk upload product data</p>
            </div>
            <button
              onClick={() => router.push('/products/create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Product</span>
            </button>
          </div>

          {/* Bulk Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Bulk Upload Products
            </h2>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
              <button
                onClick={downloadTemplate}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
              >
                <Download className="h-5 w-5" />
                <span>Download Template</span>
              </button>
              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || uploading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <Upload className="h-5 w-5" />
                )}
                <span>{uploading ? 'Uploading...' : 'Upload'}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="Dairy">Dairy</option>
                  <option value="Juice">Juice</option>
                  <option value="Yoghurt">Yoghurt</option>
                  <option value="Ghee">Ghee</option>
                  <option value="Butter">Butter</option>
                  <option value="Cheese">Cheese</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Discontinued">Discontinued</option>
                </select>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 dark:text-white">
                  <Filter className="h-5 w-5" />
                  <span>More Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Get started by adding your first product or uploading a CSV file</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => router.push('/products/create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    <span>Add Product</span>
                  </button>
                  <button
                    onClick={downloadTemplate}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Pricing
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((product) => {
                      const stockStatus = getStockStatus(product)
                      return (
                        <tr key={product._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {product.productName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {product.productCode}
                              </div>
                              <div className="mt-1 flex space-x-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getCategoryColor(product.category)}`}>
                                  {product.category}
                                </span>
                                {product.brand && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    {product.brand}
                                  </span>
                                )}
                              </div>
                              {product.unitSize && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {product.unitSize} • {product.unit}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.currency} {product.standardPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Wholesale: {product.wholesalePrice ? `${product.currency} ${product.wholesalePrice.toLocaleString()}` : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              VAT: {product.vatRate}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.currentStock} {product.unit}
                            </div>
                            <div className={`text-sm ${stockStatus.color}`}>
                              {stockStatus.status}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Min: {product.minStockLevel} {product.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                              {product.status}
                            </span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {product.isPerishable && (
                                <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                  Perishable
                                </span>
                              )}
                              {product.requiresRefrigeration && (
                                <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-cyan-100 text-cyan-800">
                                  Refrigerated
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => router.push(`/products/${product._id}`)}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Eye className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => router.push(`/products/${product._id}/edit`)}
                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                              >
                                <Edit className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => deleteProduct(product._id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing page <span className="font-medium">{page}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === i + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
