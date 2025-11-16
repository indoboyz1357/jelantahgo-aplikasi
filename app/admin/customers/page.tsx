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
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
  Eye,
  Navigation,
  Users,
  Package
} from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string
  address: string
  kelurahan: string | null
  kecamatan: string | null
  kota: string
  latitude: number
  longitude: number
  shareLocationUrl: string | null
  referralCode: string
  referredById: string | null
  isActive: boolean
  lastOrderDate: string | null
  createdAt: string
  updatedAt: string
  referredBy?: {
    id: string
    name: string
    phone: string
  } | null
  _count?: {
    pickupsAsCustomer: number
    referrals: number
  }
}

interface ReferrerOption {
  id: string
  name: string
  phone: string
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const { user: currentUser, loading: authLoading } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [referrerOptions, setReferrerOptions] = useState<ReferrerOption[]>([])
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    latitude: '',
    longitude: '',
    shareLocationUrl: '',
    referredById: '',
    isActive: true
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const limit = 10

  useEffect(() => {
    if (!authLoading && currentUser?.role !== 'ADMIN') {
      router.push('/dashboard')
    }
  }, [currentUser, authLoading, router])

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchCustomers()
    }
  }, [currentUser, currentPage, searchQuery, filterStatus])

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchReferrerOptions()
    }
  }, [currentUser])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      })

      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/customers?${params}`, {
        credentials: 'include'
      })

      if (!res.ok) throw new Error('Failed to fetch customers')

      const data = await res.json()
      setCustomers(data.customers)
      setTotalPages(data.pagination.totalPages)
      setTotalCustomers(data.pagination.total)
    } catch (error) {
      console.error('Error fetching customers:', error)
      alert('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const fetchReferrerOptions = async () => {
    try {
      const res = await fetch('/api/users?limit=1000', {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setReferrerOptions(data.users.map((u: any) => ({
        id: u.id,
        name: u.name,
        phone: u.phone
      })))
    } catch (error) {
      console.error('Error fetching referrer options:', error)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) errors.name = 'Nama wajib diisi'
    if (!formData.phone.trim()) errors.phone = 'No Handphone wajib diisi'
    if (!formData.address.trim()) errors.address = 'Alamat wajib diisi'
    if (!formData.kota.trim()) errors.kota = 'Kota wajib diisi'
    if (!formData.latitude) errors.latitude = 'Latitude wajib diisi'
    if (!formData.longitude) errors.longitude = 'Longitude wajib diisi'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setSubmitting(true)
      const url = showEditModal 
        ? `/api/admin/customers/${selectedCustomer?.id}`
        : '/api/admin/customers'
      
      const method = showEditModal ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          email: formData.email || null,
          kelurahan: formData.kelurahan || null,
          kecamatan: formData.kecamatan || null,
          shareLocationUrl: formData.shareLocationUrl || null,
          referredById: formData.referredById || null,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save customer')
      }

      if (!showEditModal && data.defaultPassword) {
        alert(`Customer berhasil dibuat!\n\nPassword default: ${data.defaultPassword}\n\nSilakan berikan password ini kepada customer.`)
      } else {
        alert(showEditModal ? 'Customer berhasil diupdate!' : 'Customer berhasil dibuat!')
      }

      setShowAddModal(false)
      setShowEditModal(false)
      resetForm()
      fetchCustomers()
    } catch (error: any) {
      console.error('Error saving customer:', error)
      alert(error.message || 'Gagal menyimpan customer')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus customer ini?')) return

    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Failed to delete customer')

      if (data.deactivated) {
        alert('Customer memiliki riwayat pickup dan telah dinonaktifkan.')
      } else {
        alert('Customer berhasil dihapus!')
      }
      
      fetchCustomers()
    } catch (error: any) {
      console.error('Error deleting customer:', error)
      alert(error.message || 'Gagal menghapus customer')
    }
  }

  const openEditModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address,
      kelurahan: customer.kelurahan || '',
      kecamatan: customer.kecamatan || '',
      kota: customer.kota,
      latitude: customer.latitude.toString(),
      longitude: customer.longitude.toString(),
      shareLocationUrl: customer.shareLocationUrl || '',
      referredById: customer.referredById || '',
      isActive: customer.isActive
    })
    setFormErrors({})
    setShowEditModal(true)
  }

  const openDetailModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setShowDetailModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      kelurahan: '',
      kecamatan: '',
      kota: '',
      latitude: '',
      longitude: '',
      shareLocationUrl: '',
      referredById: '',
      isActive: true
    })
    setFormErrors({})
    setSelectedCustomer(null)
  }

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
            shareLocationUrl: `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
          }))
        },
        (error) => {
          alert('Gagal mendapatkan lokasi: ' + error.message)
        }
      )
    } else {
      alert('Browser tidak mendukung geolocation')
    }
  }

  const filteredCustomers = customers.filter(customer => {
    if (filterStatus === 'ACTIVE' && !customer.isActive) return false
    if (filterStatus === 'INACTIVE' && customer.isActive) return false
    return true
  })
