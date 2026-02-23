'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import {
  ArrowLeft,
  Plus,
  X,
  Search,
  Package,
  User,
  FileText,
  MapPin,
  Phone,
  Mail,
  Calculator,
  Save
} from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Customer {
  _id: string
  customerNumber: string
  customerName: string
  type: string
  email?: string
  phone?: string
  address?: string
  contactPerson?: string
}

interface Product {
  _id: string
  productCode: string
  productName: string
  category: string
  standardPrice: number
  unit: string
  unitWeight?: number
}

interface OrderItem {
  product: string
  productName: string
  productCode: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function CreateOrderPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [poNumber, setPoNumber] = useState('')
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  
  // Product search state
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [selectedProductIndex, setSelectedProductIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchCustomers()
      fetchProducts()
    }
  }, [user])

  const fetchCustomers = async () => {
    try {
      setLoadingCustomers(true)
      const response = await api.get('/customers?limit=100')
      setCustomers(response.data.customers)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to fetch customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const response = await api.get('/products?limit=100')
      setProducts(response.data.products)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Failed to fetch products')
    } finally {
      setLoadingProducts(false)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.customerNumber.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.productCode.toLowerCase().includes(productSearch.toLowerCase())
  )

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer._id)
    setCustomerSearch(`${customer.customerNumber} - ${customer.customerName}`)
    setDeliveryAddress(customer.address || '')
    setContactPerson(customer.contactPerson || '')
    setContactPhone(customer.phone || '')
    setShowCustomerDropdown(false)
  }

  const handleProductSelect = (product: Product) => {
    const newItem: OrderItem = {
      product: product._id,
      productName: product.productName,
      productCode: product.productCode,
      quantity: 1,
      unitPrice: product.standardPrice,
      totalPrice: product.standardPrice
    }
    
    if (selectedProductIndex !== null) {
      // Update existing item
      const updatedItems = [...orderItems]
      updatedItems[selectedProductIndex] = newItem
      setOrderItems(updatedItems)
      setSelectedProductIndex(null)
    } else {
      // Add new item
      setOrderItems([...orderItems, newItem])
    }
    
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const updateOrderItem = (index: number, field: keyof OrderItem, value: any) => {
    const updatedItems = [...orderItems]
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index][field] = parseFloat(value) || 0
      updatedItems[index].totalPrice = updatedItems[index].quantity * updatedItems[index].unitPrice
    } else {
      updatedItems[index][field] = value
    }
    setOrderItems(updatedItems)
  }

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.totalPrice, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomer) {
      toast.error('Please select a customer')
      return
    }
    
    if (orderItems.length === 0) {
      toast.error('Please add at least one product')
      return
    }
    
    try {
      setSubmitting(true)
      
      const orderData = {
        customer: selectedCustomer,
        poNumber: poNumber || undefined,
        products: orderItems,
        deliveryAddress: deliveryAddress || undefined,
        contactPerson: contactPerson || undefined,
        contactPhone: contactPhone || undefined,
        notes: notes || undefined,
        priority
      }
      
      const response = await api.post('/orders', orderData)
      toast.success('Order created successfully')
      router.push(`/orders/${response.data._id}`)
    } catch (error: any) {
      console.error('Error creating order:', error)
      toast.error(error.response?.data?.message || 'Failed to create order')
    } finally {
      setSubmitting(false)
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/orders')}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Order</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Create a new sales order for your customer</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Customer Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select Customer *
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search customer by name or number..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value)
                          setShowCustomerDropdown(true)
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    {showCustomerDropdown && customerSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((customer) => (
                            <div
                              key={customer._id}
                              onClick={() => handleCustomerSelect(customer)}
                              className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900 dark:text-white">
                                {customer.customerName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {customer.customerNumber} • {customer.type}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
                            No customers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    PO Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter PO number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Delivery Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter delivery address"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Person
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter contact person"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Enter contact phone"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Order Items
              </h2>

              {/* Add Product */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add Product
                </label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search product by name or code..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value)
                        setShowProductDropdown(true)
                      }}
                      onFocus={() => setShowProductDropdown(true)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {showProductDropdown && productSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                          <div
                            key={product._id}
                            onClick={() => handleProductSelect(product)}
                            className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {product.productName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {product.productCode} • {product.category} • {product.unit} • RWF {product.standardPrice.toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          No products found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Order Items List */}
              {orderItems.length > 0 && (
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Product
                          </label>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {item.productCode}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updateOrderItem(index, 'unitPrice', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Total
                            </label>
                            <div className="font-medium text-gray-900 dark:text-white">
                              RWF {item.totalPrice.toLocaleString()}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOrderItem(index)}
                            className="ml-2 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Additional Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Order Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter any additional notes or special instructions..."
                />
              </div>
            </div>

            {/* Order Summary */}
            {orderItems.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Order Summary
                </h2>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      RWF {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/orders')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedCustomer || orderItems.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-5 w-5" />
                <span>{submitting ? 'Creating...' : 'Create Order'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
