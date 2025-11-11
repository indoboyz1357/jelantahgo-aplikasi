"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminCouriersPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    if (!token) return router.push('/login')
    if (user?.role !== 'ADMIN') return router.push('/dashboard')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Couriers</h1>
        <p className="text-gray-600 mt-2">This is a placeholder page. Implement courier management here.</p>
      </div>
    </div>
  )
}
