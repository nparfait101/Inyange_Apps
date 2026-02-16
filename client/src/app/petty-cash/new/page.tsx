'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X, Upload } from 'lucide-react'

const departments = [
  'Finance',
  'Technical',
  'Production',
  'Quality',
  'HR',
  'IT',
  'Commercial',
  "MD'office",
]

interface ApprovalStep {
  stepNumber: number
  approverEmail: string
}

interface PettyCashForm {
  names: string
  expenseDate: string
  reasonOfExpense: string
  department: string
  amountRequested: number
  bankAccount?: string
  bankAccountName?: string
  phoneNumber?: string
  phoneNumberName?: string
}

export default function NewPettyCashPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PettyCashForm>()

  const addApprovalStep = () => {
    setApprovalSteps([
      ...approvalSteps,
      {
        stepNumber: approvalSteps.length + 1,
        approverEmail: '',
      },
    ])
  }

  const removeApprovalStep = (index: number) => {
    setApprovalSteps(approvalSteps.filter((_, i) => i !== index).map((step, i) => ({ ...step, stepNumber: i + 1 })))
  }

  const updateApprovalStep = (index: number, email: string) => {
    const updated = [...approvalSteps]
    updated[index].approverEmail = email
    setApprovalSteps(updated)
  }

  const onSubmit = async (data: PettyCashForm) => {
    if (approvalSteps.length === 0) {
      toast.error('Please add at least one approver')
      return
    }

    if (approvalSteps.some((step) => !step.approverEmail)) {
      toast.error('Please fill in all approver emails')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('names', data.names)
      formData.append('expenseDate', data.expenseDate)
      formData.append('reasonOfExpense', data.reasonOfExpense)
      formData.append('department', data.department)
      formData.append('amountRequested', data.amountRequested.toString())
      
      if (data.bankAccount && data.bankAccountName) {
        formData.append('bankAccount', JSON.stringify({
          accountNumber: data.bankAccount,
          accountName: data.bankAccountName,
        }))
      }
      
      if (data.phoneNumber && data.phoneNumberName) {
        formData.append('phoneNumber', JSON.stringify({
          number: data.phoneNumber,
          name: data.phoneNumberName,
        }))
      }
      
      formData.append('approvalFlow', JSON.stringify(approvalSteps))
      
      if (file) {
        formData.append('attachment', file)
      }

      await api.post('/petty-cash', formData)
      toast.success('Petty cash request created successfully!')
      router.push('/petty-cash')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create petty cash request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">New Petty Cash Request</h1>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Names <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('names', { required: 'Names are required' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.names && (
                  <p className="mt-1 text-sm text-red-600">{errors.names.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expense Date <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('expenseDate', { required: 'Expense date is required' })}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.expenseDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expenseDate.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason of Expense <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('reasonOfExpense', { required: 'Reason is required' })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.reasonOfExpense && (
                  <p className="mt-1 text-sm text-red-600">{errors.reasonOfExpense.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('department', { required: 'Department is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p className="mt-1 text-sm text-red-600">{errors.department.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount Requested (RWF) <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('amountRequested', {
                    required: 'Amount is required',
                    min: { value: 1, message: 'Amount must be greater than 0' },
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.amountRequested && (
                  <p className="mt-1 text-sm text-red-600">{errors.amountRequested.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bank Account (Optional)
                </label>
                <input
                  {...register('bankAccount')}
                  type="text"
                  placeholder="Account Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                />
                <input
                  {...register('bankAccountName')}
                  type="text"
                  placeholder="Account Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number (Optional)
                </label>
                <input
                  {...register('phoneNumber')}
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-2"
                />
                <input
                  {...register('phoneNumberName')}
                  type="text"
                  placeholder="Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Attachment (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <div className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500">
                      <Upload className="h-5 w-5 mr-2" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {file ? file.name : 'Choose file'}
                      </span>
                    </div>
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (Max 5MB)</p>
              </div>
            </div>

            {/* Approval Flow Section */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Approval Flow
                </h3>
                <button
                  type="button"
                  onClick={addApprovalStep}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Approver</span>
                </button>
              </div>

              <div className="space-y-3">
                {approvalSteps.map((step, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                      {index + 1}st Approver:
                    </span>
                    <input
                      type="email"
                      value={step.approverEmail}
                      onChange={(e) => updateApprovalStep(index, e.target.value)}
                      placeholder="Approver email"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeApprovalStep(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
                disabled={loading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
