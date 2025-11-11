'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Truck,
  MapPin,
  Package,
  CheckCircle2,
  Clock,
  DollarSign,
  Navigation,
  Home,
  ClipboardList,
  Wallet,
  User,
  LogOut,
  PhoneCall
} from 'lucide-react'

export default function CourierDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('home')
  const [stats, setStats] = useState({
    todayPickups: 0,
    completedToday: 0,
    pendingPickups: 0,
    todayEarnings: 0,
    totalEarnings: 0,
    completedTotal: 0
  })

  const [assignedPickups, setAssignedPickups] = useState([
    {
      id: '1',
      customerName: 'Budi Santoso',
      address: 'Jl. Kebon Jeruk No. 12, Jakarta Barat',
      volume: 25,
      scheduledDate: '2024-01-15T10:00:00',
      status: 'ASSIGNED',
      phone: '081234567890',
      latitude: -6.200000,
      longitude: 106.816666
    },
    {
      id: '2',
      customerName: 'Siti Aminah',
      address: 'Jl. Melati No. 45, Jakarta Selatan',
      volume: 30,
      scheduledDate: '2024-01-15T14:00:00',
      status: 'IN_PROGRESS',
      phone: '081234567891',
      latitude: -6.200000,
      longitude: 106.816666
    }
  ])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    
    if (!token) {
      router.push('/login')
      return
    }

    if (userData.role !== 'COURIER') {
      router.push('/dashboard')
      return
    }

    setUser(userData)
    fetchCourierStats(token)
  }, [])

  const fetchCourierStats = async (token: string) => {
    try {
      const res = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      setStats({
        todayPickups: data.todayPickups || 0,
        completedToday: data.completedToday || 0,
        pendingPickups: data.pendingPickups || 0,
        todayEarnings: data.todayEarnings || 0,
        totalEarnings: data.totalEarnings || 0,
        completedTotal: data.completedTotal || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const openMaps = (lat: number, lng: number, address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    window.open(url, '_blank')
  }

  const callCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`
  }

  const updatePickupStatus = async (pickupId: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/pickups/${pickupId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (res.ok) {
        alert('Status berhasil diupdate!')
        fetchCourierStats(localStorage.getItem('token')!)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Gagal update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const bottomNavItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/courier' },
    { id: 'pickups', label: 'Pickups', icon: ClipboardList, badge: stats.pendingPickups, path: '/pickups' },
    { id: 'earnings', label: 'Komisi', icon: Wallet, path: '/commissions' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <Truck className="w-6 h-6" />
                JelantahGO Kurir
              </h1>
              <p className="text-xs md:text-sm text-blue-100">Dashboard Kurir</p>
            </div>
            <div className="flex gap-2 md:gap-4 items-center">
              <span className="text-xs md:text-sm text-white hidden sm:block">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-white text-blue-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-blue-50 text-xs md:text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white mb-6 md:mb-8 shadow-lg">
          <h2 className="text-lg md:text-2xl font-bold">Selamat pagi, {user?.name}! 🚚</h2>
          <p className="text-sm md:text-base opacity-90 mt-1">Siap untuk pickup hari ini?</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.todayPickups}</p>
            <p className="text-xs text-gray-600">Pickup Hari Ini</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
            <p className="text-xs text-gray-600">Selesai</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingPickups}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">Rp {(stats.todayEarnings / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-600">Komisi Hari Ini</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assigned Pickups */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Pickup Assignment</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                {assignedPickups.length} Tugas
              </span>
            </div>
            <div className="space-y-4">
              {assignedPickups.map((pickup) => (
                <div key={pickup.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{pickup.customerName}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(pickup.status)}`}>
                        {pickup.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Volume</p>
                      <p className="font-bold text-blue-600">{pickup.volume}L</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{pickup.address}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-700">
                        {new Date(pickup.scheduledDate).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openMaps(pickup.latitude, pickup.longitude, pickup.address)}
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Navigation className="w-4 h-4" />
                      Navigasi
                    </button>
                    <button
                      onClick={() => callCustomer(pickup.phone)}
                      className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Hubungi
                    </button>
                  </div>

                  {pickup.status === 'ASSIGNED' && (
                    <button
                      onClick={() => updatePickupStatus(pickup.id, 'IN_PROGRESS')}
                      className="w-full mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      Mulai Pickup
                    </button>
                  )}
                  
                  {pickup.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => updatePickupStatus(pickup.id, 'COMPLETED')}
                      className="w-full mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      ✓ Selesaikan Pickup
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Today's Earnings */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <h3 className="font-semibold mb-2">Komisi Hari Ini</h3>
              <p className="text-3xl font-bold mb-4">Rp {stats.todayEarnings.toLocaleString()}</p>
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex justify-between">
                  <span>Total Komisi</span>
                  <span className="font-semibold">Rp {stats.totalEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pickup Selesai</span>
                  <span className="font-semibold">{stats.completedTotal} kali</span>
                </div>
              </div>
              <button className="w-full mt-4 bg-white text-purple-600 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors">
                Lihat Detail Komisi
              </button>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Performa Anda</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Tingkat Penyelesaian</span>
                    <span className="font-semibold text-gray-900">98%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Rating Customer</span>
                    <span className="font-semibold text-gray-900">4.8/5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Ketepatan Waktu</span>
                    <span className="font-semibold text-gray-900">95%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Tips Kurir</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <p>Konfirmasi kedatangan via chat</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <p>Cek kualitas minyak sebelum ambil</p>
                </div>
                <div className="flex gap-2">
                  <span className="text-green-500">✓</span>
                  <p>Update status secara real-time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
        <div className="grid grid-cols-4 h-16">
          {bottomNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  if (item.path) {
                    router.push(item.path)
                  }
                }}
                className={`relative flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div className="relative">
                  <Icon className="w-6 h-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
