'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import Header from '@/components/Header'

export default function BillsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchBills()
    }
  }, [user, authLoading, filter])

  const fetchBills = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = filter === 'ALL' ? '/api/bills' : `/api/bills?status=${filter}`
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setBills(response.data)
    } catch (error) {
      toast.error('Failed to fetch bills')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (billId: string) => {
    if (!confirm('Confirm payment for this bill?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/api/bills/${billId}`, 
        { status: 'PAID' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Payment confirmed!')
      fetchBills()
    } catch (error) {
      toast.error('Failed to process payment')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      UNPAID: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Bills</h1>
          <p className="text-gray-600 mt-2">Manage your bills and payments</p>
        </div>

        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="flex gap-2">
            {['ALL', 'UNPAID', 'PAID', 'OVERDUE'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded ${
                  filter === status 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No bills found
                  </td>
                </tr>
              ) : (
                bills.map((bill: any) => (
                  <tr key={bill.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {bill.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      Rp {bill.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(bill.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bill.status)}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {bill.status === 'UNPAID' && user?.role === 'ADMIN' && (
                        <button
                          onClick={() => handlePayment(bill.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                        >
                          Mark Paid
                        </button>
                      )}
                      {bill.status === 'PAID' && bill.paidDate && (
                        <span className="text-xs text-gray-500">
                          Paid: {new Date(bill.paidDate).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
