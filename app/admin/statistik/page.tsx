"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react'

export default function AdminStatistikPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    if (!token) return router.push('/login')
    if (user?.role !== 'ADMIN') return router.push('/dashboard')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Statistik</h1>
          <p className="text-gray-600 mt-2">Visualisasi data dan statistik bisnis JelantahGO</p>
        </div>

        {/* Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">Coming Soon</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Volume Trends</span>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">Coming Soon</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">User Growth</span>
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">Coming Soon</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">Performance</span>
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">Coming Soon</div>
          </div>
        </div>

        {/* Main Content Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Statistik & Analytics</h2>
            <p className="text-gray-600 mb-6">
              Halaman ini akan menampilkan grafik dan visualisasi data untuk membantu analisis bisnis.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                🚧 Fitur dalam pengembangan. Akan segera hadir:
                <br />• Grafik Pendapatan vs Pengeluaran
                <br />• Trend Volume Pickup
                <br />• Statistik Pertumbuhan User
                <br />• Dan banyak lagi...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
