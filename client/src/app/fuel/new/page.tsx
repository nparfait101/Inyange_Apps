'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

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

interface FuelForm {
  employeeName: string
  dateOfRequest: string
  purpose: string
  department: string
  typeOfRequest: 'Fuel' | 'vehicle'
}

export default function NewFuelPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([])
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FuelForm>()

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

  const onSubmit = async (data: FuelForm) => {
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
      await api.post('/fuel', {
        ...data,
        approvalFlow: approvalSteps,
      })
      toast.success('Fuel request created successfully!')
      router.push('/fuel')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create fuel request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            New Fuel & Vehicle Request
          </h1>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name of Employee <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('employeeName', { required: 'Employee name is required' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.employeeName && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Request <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('dateOfRequest', { required: 'Date is required' })}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.dateOfRequest && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfRequest.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purpose <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('purpose', { required: 'Purpose is required' })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
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
                  Type of Request <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register('typeOfRequest', { required: 'Type is required' })}
                      type="radio"
                      value="Fuel"
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Fuel</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('typeOfRequest', { required: 'Type is required' })}
                      type="radio"
                      value="vehicle"
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Vehicle</span>
                  </label>
                </div>
                {errors.typeOfRequest && (
                  <p className="mt-1 text-sm text-red-600">{errors.typeOfRequest.message}</p>
                )}
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
