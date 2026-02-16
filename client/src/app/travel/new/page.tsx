'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Sidebar } from '@/components/Sidebar'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

const grades = ['A', 'B', 'C', 'D', 'E', 'F', 'M1', 'M2', 'M3', 'M4']
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
const financingCompanies = ['INYANGE', 'MPP', 'MUKAMIRA', 'GIHEKE']

interface ApprovalStep {
  stepNumber: number
  approverEmail: string
}

interface TravelForm {
  employeeName: string
  position: string
  grade: string
  travelPurpose: string
  dateOfDeparture: string
  dateOfReturn: string
  travelType: 'Domestic' | 'Foreign'
  financingCompany: string
  department: string
}

export default function NewTravelPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [approvalSteps, setApprovalSteps] = useState<ApprovalStep[]>([])
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TravelForm>()

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

  const onSubmit = async (data: TravelForm) => {
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
      await api.post('/travel', {
        ...data,
        approvalFlow: approvalSteps,
      })
      toast.success('Travel request created successfully!')
      router.push('/travel')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create travel request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">New Travel Request</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
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
                  Position <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('position', { required: 'Position is required' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.position && (
                  <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('grade', { required: 'Grade is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Grade</option>
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
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
                  Travel Purpose <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('travelPurpose', { required: 'Travel purpose is required' })}
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.travelPurpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.travelPurpose.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Financing Company <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('financingCompany', { required: 'Financing company is required' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Select Company</option>
                  {financingCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
                {errors.financingCompany && (
                  <p className="mt-1 text-sm text-red-600">{errors.financingCompany.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Departure <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('dateOfDeparture', { required: 'Date of departure is required' })}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.dateOfDeparture && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfDeparture.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Return <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('dateOfReturn', { required: 'Date of return is required' })}
                  type="date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                {errors.dateOfReturn && (
                  <p className="mt-1 text-sm text-red-600">{errors.dateOfReturn.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Travel Type <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register('travelType', { required: 'Travel type is required' })}
                      type="radio"
                      value="Domestic"
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Domestic</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('travelType', { required: 'Travel type is required' })}
                      type="radio"
                      value="Foreign"
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Foreign</span>
                  </label>
                </div>
                {errors.travelType && (
                  <p className="mt-1 text-sm text-red-600">{errors.travelType.message}</p>
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
