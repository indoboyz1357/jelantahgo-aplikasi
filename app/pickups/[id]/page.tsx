'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import Header from '@/components/Header'

export default function PickupDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [pickup, setPickup] = useState<any>(null)
  const [assignCourier, setAssignCourier] = useState(false)
  const [couriers, setCouriers] = useState([])
  const [selectedCourier, setSelectedCourier] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchPickupDetail()
    }
  }, [user, authLoading, params.id])

  const fetchPickupDetail = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/pickups/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPickup(response.data)
      
      // Fetch available couriers for admin
      if (user && user.role === 'ADMIN') {
        const couriersResponse = await axios.get('/api/users?role=COURIER', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setCouriers(couriersResponse.data.users)
      }
    } catch (error: any) {
      toast.error('Failed to fetch pickup details')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignCourier = async () => {
    if (!selectedCourier) {
      toast.error('Please select a courier')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/api/pickups/${params.id}`, {
        status: 'ASSIGNED',
        courierId: selectedCourier
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Courier assigned successfully!')
      setAssignCourier(false)
      fetchPickupDetail()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign courier')
    }
  }

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/api/pickups/${params.id}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success(`Status updated to ${newStatus}`)
      fetchPickupDetail()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const handleCompletePickup = async (actualWeight: number) => {
    if (!actualWeight || actualWeight <= 0) {
      toast.error('Please enter valid weight')
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.patch(`/api/pickups/${params.id}`, {
        status: 'COMPLETED',
        actualWeight: actualWeight
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success('Pickup completed successfully!')
      fetchPickupDetail()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete pickup')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: any = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!pickup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Pickup not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/pickups')}
            className="text-green-600 hover:text-green-700 flex items-center"
          >
            ← Back to Pickups
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">Pickup Details</h1>
              <p className="text-gray-600">ID: {pickup.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(pickup.status)}`}>
              {pickup.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Customer Information</h3>
              <p className="text-gray-600">{pickup.customer.name}</p>
              <p className="text-gray-600">{pickup.customer.phone}</p>
              <p className="text-gray-600">{pickup.customer.email}</p>
            </div>

            {pickup.courier && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Courier Information</h3>
                <p className="text-gray-600">{pickup.courier.name}</p>
                <p className="text-gray-600">{pickup.courier.phone}</p>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600 text-sm">Pickup Address</p>
                <p className="font-medium">{pickup.address}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Pickup Date</p>
                <p className="font-medium">{new Date(pickup.pickupDate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Estimated Weight</p>
                <p className="font-medium">{pickup.estimatedWeight} kg</p>
              </div>
              {pickup.actualWeight && (
                <div>
                  <p className="text-gray-600 text-sm">Actual Weight</p>
                  <p className="font-medium">{pickup.actualWeight} kg</p>
                </div>
              )}
              {pickup.price && (
                <div>
                  <p className="text-gray-600 text-sm">Price</p>
                  <p className="font-medium">Rp {pickup.price.toLocaleString()}</p>
                </div>
              )}
            </div>

            {pickup.notes && (
              <div className="mt-4">
                <p className="text-gray-600 text-sm">Notes</p>
                <p className="font-medium">{pickup.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions based on role and status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-lg mb-4">Actions</h3>
          
          {/* Admin: Assign courier */}
          {user?.role === 'ADMIN' && pickup.status === 'PENDING' && (
            <div className="mb-4">
              {!assignCourier ? (
                <button
                  onClick={() => setAssignCourier(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Assign Courier
                </button>
              ) : (
                <div className="space-y-3">
                  <select
                    value={selectedCourier}
                    onChange={(e) => setSelectedCourier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Courier</option>
                    {couriers.map((courier: any) => (
                      <option key={courier.id} value={courier.id}>
                        {courier.name} - {courier.phone}
                      </option>
                    ))}
                  </select>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAssignCourier}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Assign
                    </button>
                    <button
                      onClick={() => setAssignCourier(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Courier: Start/Complete pickup */}
          {user?.role === 'COURIER' && pickup.courierId === user.id && (
            <div className="space-y-3">
              {pickup.status === 'ASSIGNED' && (
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  Start Pickup
                </button>
              )}
              
              {pickup.status === 'IN_PROGRESS' && (
                <div>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Actual weight (kg)"
                    id="actualWeight"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2"
                  />
                  <button
                    onClick={() => {
                      const weight = parseFloat((document.getElementById('actualWeight') as HTMLInputElement).value)
                      handleCompletePickup(weight)
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Complete Pickup
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Customer: Cancel pickup */}
          {user?.role === 'CUSTOMER' && pickup.customerId === user.id && pickup.status === 'PENDING' && (
            <button
              onClick={() => handleUpdateStatus('CANCELLED')}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Cancel Pickup
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
