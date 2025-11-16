"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

interface UserOption {
  id: string
  name: string
  email: string
  address?: string
}

export default function AdminNewPickupPage() {
  const router = useRouter()
  const { user: authUser, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)

  const [showRegister, setShowRegister] = useState(false)
  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  })
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    volume: '',
    date: '',
    time: '',
    notes: ''
  })

  useEffect(() => {
    if (authLoading) return

    const token = localStorage.getItem('token')
    if (!token) return router.push('/login')

    // If user info not yet loaded but token exists, wait without redirecting
    if (!authUser) return

    if (authUser.role !== 'ADMIN') return router.push('/dashboard')
    fetchUsers('')
  }, [authUser, authLoading])

  const fetchUsers = async (q: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get(`/api/users?role=CUSTOMER&search=${encodeURIComponent(q)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(res.data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load customers')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return toast.error('Select a customer')
    if (!formData.volume || !formData.date) return toast.error('Volume and date are required')

    const scheduledDate = `${formData.date}T${formData.time || '09:00'}:00`

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      await axios.post('/api/pickups', {
        customerId: selectedUser.id,
        scheduledDate,
        volume: parseFloat(formData.volume),
        notes: formData.notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Pickup request created')
      router.push('/pickups')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create pickup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin: New Pickup</h1>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                fetchUsers(e.target.value)
              }}
              placeholder="Search customer by name, email, or phone"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <div className="mt-2 max-h-48 overflow-auto border rounded">
              {users.map(u => (
                <button
                  type="button"
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${selectedUser?.id === u.id ? 'bg-green-50' : ''}`}
                >
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.email}</div>
                </button>
              ))}
              {users.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No customers found. 
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegister(true)
                      setRegisterForm({ ...registerForm, phone: search })
                    }}
                    className="text-green-600 underline ml-1"
                  >
                    Register new customer?
                  </button>
                </div>
              )}
            </div>
            {selectedUser && (
              <div className="mt-2 text-sm text-gray-700">
                Selected: <span className="font-medium">{selectedUser.name}</span>
              </div>
            )}

            {showRegister && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">Register New Customer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Name"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Address (optional)"
                    value={registerForm.address}
                    onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-3 mt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token')
                        // Generate a temporary password (e.g., phone + '123') or any policy you prefer
                        const generatedPassword = (registerForm.phone || 'User') + '123'
                        setTempPassword(generatedPassword)
                        const res = await axios.post('/api/auth/register', {
                          email: registerForm.email,
                          password: generatedPassword,
                          name: registerForm.name,
                          phone: registerForm.phone,
                          address: registerForm.address
                        })
                        const newUser = res.data.user
                        toast.success('Customer registered')
                        setSelectedUser({ id: newUser.id, name: newUser.name, email: newUser.email })
                        setShowRegister(false)
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || 'Failed to register customer')
                      }
                    }}
                    className="bg-green-600 text-white px-3 py-2 rounded"
                  >
                    Save & Use This Customer
                  </button>
                  <button type="button" onClick={() => setShowRegister(false)} className="px-3 py-2 border rounded">Cancel</button>
                  {tempPassword && (
                    <div className="text-xs text-gray-500 self-center">Temporary password: {tempPassword}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Volume (L)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.volume}
              onChange={(e) => setFormData({ ...formData, volume: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Pickup'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="px-4 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
