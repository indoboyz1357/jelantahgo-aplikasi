'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    kelurahan: '',
    kecamatan: '',
    kota: '',
    latitude: '',
    longitude: '',
    shareLocationUrl: '',
    referralCode: ''
  })

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung geolocation')
      return
    }

    setLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        setFormData(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          shareLocationUrl: `https://www.google.com/maps?q=${lat},${lng}`
        }))
        
        toast.success('Lokasi berhasil didapatkan!')
        setLoadingLocation(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Gagal mendapatkan lokasi. Pastikan GPS aktif dan izin lokasi diberikan.')
        setLoadingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi password
    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }

    // Validasi field wajib
    if (!formData.name.trim()) {
      toast.error('Nama wajib diisi')
      return
    }

    if (!formData.phone.trim()) {
      toast.error('No. Handphone wajib diisi')
      return
    }

    if (!formData.address.trim()) {
      toast.error('Alamat wajib diisi')
      return
    }

    if (!formData.kota.trim()) {
      toast.error('Kota wajib diisi')
      return
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error('Share Lokasi wajib diisi. Klik tombol "Ambil Lokasi Saya"')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          password: formData.password,
          address: formData.address.trim(),
          kelurahan: formData.kelurahan.trim() || undefined,
          kecamatan: formData.kecamatan.trim() || undefined,
          kota: formData.kota.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          shareLocationUrl: formData.shareLocationUrl || undefined,
          referralCode: formData.referralCode.trim() || undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Registrasi berhasil! Silakan login.')
        router.push('/login')
      } else {
        toast.error(data.message || 'Registrasi gagal')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 py-12 px-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Daftar JelantahGO</h1>
          <p className="text-gray-600 mt-2">Mulai kelola minyak jelantah Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Grid 2 kolom untuk desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nama Lengkap - WAJIB */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nama lengkap Anda"
              />
            </div>

            {/* No. Handphone - WAJIB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. Handphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="08123456789"
              />
            </div>

            {/* Email - OPSIONAL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="email@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder="Minimal 6 karakter"
              />
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="Ketik ulang password"
              />
            </div>
          </div>

          {/* Alamat Lengkap - WAJIB */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat Lengkap <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Jl. Contoh No. 123, RT/RW, Detail lokasi..."
              rows={2}
            />
          </div>

          {/* Grid 3 kolom untuk Kelurahan, Kecamatan, Kota */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Kelurahan - OPSIONAL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kelurahan <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.kelurahan}
                onChange={(e) => setFormData({...formData, kelurahan: e.target.value})}
                placeholder="Kelurahan"
              />
            </div>

            {/* Kecamatan - OPSIONAL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kecamatan <span className="text-gray-400 text-xs">(Opsional)</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.kecamatan}
                onChange={(e) => setFormData({...formData, kecamatan: e.target.value})}
                placeholder="Kecamatan"
              />
            </div>

            {/* Kota - WAJIB */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kota <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={formData.kota}
                onChange={(e) => setFormData({...formData, kota: e.target.value})}
                placeholder="Jakarta, Surabaya, dll"
              />
            </div>
          </div>

          {/* Share Lokasi - WAJIB */}
          <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Lokasi <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-600 mb-3">
              Diperlukan agar kurir dapat menemukan lokasi Anda dengan mudah
            </p>
            
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loadingLocation ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Mengambil Lokasi...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Ambil Lokasi Saya
                </>
              )}
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
          </div>

          {/* Kode Referral - OPSIONAL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referred By / Kode Referral <span className="text-gray-400 text-xs">(Opsional)</span>
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              value={formData.referralCode}
              onChange={(e) => setFormData({...formData, referralCode: e.target.value})}
              placeholder="Masukkan kode referral jika ada"
            />
            <p className="text-xs text-gray-500 mt-1">
              Dapatkan bonus dengan menggunakan kode referral dari teman
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          >
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
              Login di sini
            </Link>
          </p>
        </div>

        {/* Field Information */}
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600">
            <span className="text-red-500">*</span> Field wajib diisi
          </p>
          <p className="text-xs text-gray-600 mt-1">
            💡 Share Lokasi diperlukan agar kurir dapat menemukan alamat Anda dengan mudah
          </p>
        </div>
      </div>
    </div>
  )
}
