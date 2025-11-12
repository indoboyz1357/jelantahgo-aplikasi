'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      toast.success('Login berhasil!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Login gagal'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">JelantahGO</h1>
          <p className="text-gray-600 mt-2">Sistem Manajemen Minyak Jelantah</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="text-green-600 hover:text-green-700 font-medium">
              Daftar Sekarang
            </Link>
          </p>
        </div>

        <div className="mt-8 border-t pt-6">
          <p className="text-xs text-gray-500 text-center mb-4">Demo Accounts:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold">Admin</p>
              <p>admin@jelantahgo.com</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold">Customer</p>
              <p>customer1@jelantahgo.com</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold">Courier</p>
              <p>courier@jelantahgo.com</p>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <p className="font-semibold">Warehouse</p>
              <p>warehouse@jelantahgo.com</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">Password: demo123</p>
        </div>
      </div>
    </div>
  )
}
