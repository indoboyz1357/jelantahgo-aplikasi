import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { normalizePhone } from '@/lib/utils';

const prisma = new PrismaClient();

function generateReferralCode() {
  return 'REF' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { 
      email: rawEmail,      // OPSIONAL
      password: rawPassword, 
      name,                  // WAJIB
      phone: rawPhone,       // WAJIB
      address,               // WAJIB - Alamat Lengkap
      kelurahan,             // OPSIONAL
      kecamatan,             // OPSIONAL
      kota,                  // WAJIB
      latitude,              // WAJIB - dari Share Lokasi
      longitude,             // WAJIB - dari Share Lokasi
      shareLocationUrl,      // OPSIONAL - Google Maps share link
      referralCode           // OPSIONAL - Di referensikan oleh
    } = await request.json();

    // ====== VALIDASI FIELD WAJIB ======
    const phone = normalizePhone(rawPhone);
    
    if (!name || !phone || !address || !kota) {
      return NextResponse.json(
        { message: 'Field wajib: Nama, No HP, Alamat Lengkap, dan Kota harus diisi' },
        { status: 400 }
      );
    }

    // Validasi latitude & longitude (Share Lokasi WAJIB)
    if (latitude === undefined || longitude === undefined || 
        latitude === null || longitude === null) {
      return NextResponse.json(
        { message: 'Share Lokasi wajib diisi (latitude & longitude)' },
        { status: 400 }
      );
    }

    // Validasi format latitude & longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { message: 'Format Share Lokasi tidak valid' },
        { status: 400 }
      );
    }

    // ====== NORMALIZE EMAIL ======
    // Email opsional, jika tidak diisi generate otomatis
    let email = (rawEmail || '').trim();
    if (!email) {
      const base = (phone || 'user').replace(/[^a-zA-Z0-9]/g, '');
      email = `${base}-${Date.now()}@jelantahgo.local`;
    }

    // ====== CEK PHONE DUPLIKAT ======
    const existingPhone = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingPhone) {
      return NextResponse.json(
        { message: 'Nomor HP sudah terdaftar' },
        { status: 400 }
      );
    }

    // ====== CEK EMAIL DUPLIKAT ======
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // ====== GENERATE PASSWORD JIKA TIDAK ADA ======
    let password = rawPassword;
    if (!password) {
      password = Math.random().toString(36).slice(-10) + 'A1!';
    }

    // ====== FIND REFERRER (OPSIONAL) ======
    let referrerId = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      
      if (referrer) {
        referrerId = referrer.id;
      } else {
        return NextResponse.json(
          { message: 'Kode referral tidak valid' },
          { status: 400 }
        );
      }
    }

    // ====== HASH PASSWORD ======
    const hashedPassword = await bcrypt.hash(password, 10);

    // ====== GENERATE UNIQUE REFERRAL CODE ======
    let newReferralCode = generateReferralCode();
    let codeExists = await prisma.user.findUnique({
      where: { referralCode: newReferralCode }
    });
    
    while (codeExists) {
      newReferralCode = generateReferralCode();
      codeExists = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
    }

    // ====== CREATE USER ======
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        address,
        kelurahan: kelurahan || null,
        kecamatan: kecamatan || null,
        kota,
        latitude: lat,
        longitude: lng,
        shareLocationUrl: shareLocationUrl || null,
        role: 'CUSTOMER',
        isActive: true,
        referralCode: newReferralCode,
        referredById: referrerId
      }
    });

    // Return generated password only if it was auto-generated
    const passwordGenerated = rawPassword ? undefined : password;

    return NextResponse.json(
      { 
        message: 'Registrasi berhasil', 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          phone: user.phone, 
          address: user.address,
          kelurahan: user.kelurahan,
          kecamatan: user.kecamatan,
          kota: user.kota,
          latitude: user.latitude,
          longitude: user.longitude,
          shareLocationUrl: user.shareLocationUrl,
          role: user.role,
          referralCode: user.referralCode
        },
        tempPassword: passwordGenerated
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan saat registrasi', error: error.message },
      { status: 500 }
    );
  }
}
