"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  role: 'ADMIN' | 'CUSTOMER' | 'COURIER' | 'WAREHOUSE'
  isActive: boolean
  createdAt: string
  referralCode: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    latitude: '',
    longitude: '',
    shareLocationUrl: '',
    referralCode: '',
    role: 'CUSTOMER',
    password: ''
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login')
      return
    }

    if (currentUser?.role !== 'ADMIN') {
      router.push('/admin')
      return
    }

    if (currentUser) {
      fetchUsers()
    }
  }, [currentUser, authLoading])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data pengguna' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan saat memuat data' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengguna berhasil ditambahkan' })
        setShowAddModal(false)
        resetForm()
        fetchUsers()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.message || 'Gagal menambahkan pengguna' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const { password, ...updateData } = formData
      const dataToSend = password ? { ...updateData, password } : updateData

      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengguna berhasil diperbarui' })
        setShowEditModal(false)
        resetForm()
        fetchUsers()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.message || 'Gagal memperbarui pengguna' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return

    setDeleting(userId)
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Pengguna berhasil dihapus' })
        fetchUsers()
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.message || 'Gagal menghapus pengguna' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setDeleting(null)
    }
  }

  const handleEditClick = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address || '',
      kelurahan: (user as any).kelurahan || '',
      kecamatan: (user as any).kecamatan || '',
      kota: (user as any).kota || '',
      latitude: (user as any).latitude?.toString() || '',
      longitude: (user as any).longitude?.toString() || '',
      shareLocationUrl: (user as any).shareLocationUrl || '',
      referralCode: '',
      role: user.role,
      password: ''
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      kelurahan: '',
      kecamatan: '',
      kota: '',
      latitude: '',
      longitude: '',
      shareLocationUrl: '',
      referralCode: '',
      role: 'CUSTOMER',
      password: ''
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.includes(searchQuery)
    const matchesRole = filterRole === 'ALL' || user.role === filterRole
    const matchesStatus = filterStatus === 'ALL' || (filterStatus === 'ACTIVE' ? user.isActive : !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'CUSTOMER':
        return 'bg-blue-100 text-blue-800'
      case 'COURIER':
        return 'bg-green-100 text-green-800'
      case 'WAREHOUSE':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin'
      case 'CUSTOMER':
        return 'Pelanggan'
      case 'COURIER':
        return 'Kurir'
      case 'WAREHOUSE':
        return 'Gudang'
      default:
        return role
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Alert Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Kelola Admin, Kurir, Pelanggan, dan Gudang</p>
          </div>
          <button
            onClick={() => {
              resetForm()
              setShowAddModal(true)
            }}
            className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Pengguna
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari nama, email, atau telepon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Filter by Role */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">Semua Role</option>
              <option value="ADMIN">Admin</option>
              <option value="CUSTOMER">Pelanggan</option>
              <option value="COURIER">Kurir</option>
              <option value="WAREHOUSE">Gudang</option>
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nama</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Telepon</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Terdaftar</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                          <Shield className="w-3 h-3" />
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? (
                            <><CheckCircle className="w-3 h-3" /> Aktif</>
                          ) : (
                            <><XCircle className="w-3 h-3" /> Tidak Aktif</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(user.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleting === user.id}
                            className={`p-2 rounded-lg transition-colors ${
                              deleting === user.id
                                ? 'bg-red-50 text-red-400'
                                : 'hover:bg-red-50 text-red-600'
                            }`}
                            title="Hapus"
                          >
                            {deleting === user.id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Tidak ada pengguna yang ditemukan</p>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox 
            label="Total Pengguna" 
            value={users.length} 
            color="blue"
          />
          <StatBox 
            label="Admin" 
            value={users.filter(u => u.role === 'ADMIN').length} 
            color="red"
          />
          <StatBox 
            label="Kurir" 
            value={users.filter(u => u.role === 'COURIER').length} 
            color="green"
          />
          <StatBox 
            label="Gudang" 
            value={users.filter(u => u.role === 'WAREHOUSE').length} 
            color="purple"
          />
        </div>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <UserModal
          title="Tambah Pengguna Baru"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleAddUser}
          onClose={() => {
            setShowAddModal(false)
            resetForm()
          }}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isEdit={false}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <UserModal
          title="Edit Pengguna"
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdateUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
            resetForm()
          }}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isEdit={true}
        />
      )}
    </div>
  )
}

interface UserModalProps {
  title: string
  formData: any
  setFormData: (data: any) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  showPassword: boolean
  setShowPassword: (show: boolean) => void
  isEdit: boolean
}

function UserModal({
  title,
  formData,
  setFormData,
  onSubmit,
  onClose,
  showPassword,
  setShowPassword,
  isEdit
}: UserModalProps) {
  const [loadingLocation, setLoadingLocation] = useState(false)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolocation')
      return
    }

    setLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        setFormData({
          ...formData,
          latitude: lat.toString(),
          longitude: lng.toString(),
          shareLocationUrl: `https://www.google.com/maps?q=${lat},${lng}`
        })
        
        alert('Lokasi berhasil didapatkan!')
        setLoadingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        alert('Gagal mendapatkan lokasi')
        setLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Grid 2 kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* No HP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Handphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Alamat Lengkap */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={2}
              placeholder="Jl. Contoh No. 123, RT/RW"
            />
          </div>

          {/* Grid 3 kolom untuk Kelurahan, Kecamatan, Kota */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kelurahan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelurahan <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.kelurahan || ''}
                onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Kelurahan"
              />
            </div>

            {/* Kecamatan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kecamatan <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.kecamatan || ''}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Kecamatan"
              />
            </div>

            {/* Kota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kota <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.kota || ''}
                onChange={(e) => setFormData({ ...formData, kota: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Jakarta, Surabaya, dll"
              />
            </div>
          </div>

          {/* Share Lokasi */}
          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Lokasi <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Diperlukan agar kurir dapat menemukan lokasi dengan mudah
            </p>
            
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingLocation ? 'Mengambil Lokasi...' : '📍 Ambil Lokasi Saya'}
            </button>

            {formData.latitude && formData.longitude && (
              <div className="mt-3 p-2 bg-white rounded border border-green-300">
                <p className="text-xs text-gray-600">
                  <strong>Koordinat:</strong> {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                </p>
                {formData.shareLocationUrl && (
                  <a 
                    href={formData.shareLocationUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:text-green-800 underline mt-1 block"
                  >
                    Lihat di Google Maps →
                  </a>
                )}
              </div>
            )}

            <input type="hidden" required={!isEdit} value={formData.latitude || ''} />
            <input type="hidden" required={!isEdit} value={formData.longitude || ''} />
          </div>

          {/* Referred By */}
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referred By / Kode Referral <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                value={formData.referralCode || ''}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Kode referral (jika ada)"
              />
            </div>
          )}

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="CUSTOMER">Pelanggan</option>
              <option value="COURIER">Kurir</option>
              <option value="WAREHOUSE">Gudang</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isEdit ? 'Password (Kosongkan jika tidak ingin mengubah)' : 'Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required={!isEdit}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {isEdit ? 'Update' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface StatBoxProps {
  label: string
  value: number
  color: 'blue' | 'red' | 'green' | 'purple'
}

function StatBox({ label, value, color }: StatBoxProps) {
  const bgClasses = {
    blue: 'bg-blue-50',
    red: 'bg-red-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50'
  }

  const textClasses = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  }

  return (
    <div className={`${bgClasses[color]} rounded-lg p-4`}>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textClasses[color]}`}>{value}</p>
    </div>
  )
}
