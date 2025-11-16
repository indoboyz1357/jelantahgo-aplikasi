import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { normalizePhone } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let where: any = {};

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (search) {
      const normalizedPhone = normalizePhone(search);
      const phoneCandidates = [normalizedPhone, search];
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        // Try normalized exact match for phone
        { phone: { in: phoneCandidates } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          address: true,
          role: true,
          isActive: true,
          referralCode: true,
          createdAt: true,
          _count: {
            select: {
              pickupsAsCustomer: true,
              pickupsAsCourier: true,
              referrals: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    const body = await request.json();
    const { 
      name, 
      email: rawEmail, 
      phone: rawPhone, 
      address, 
      kelurahan,
      kecamatan,
      kota,
      latitude,
      longitude,
      shareLocationUrl,
      referralCode: referredByCode,
      role, 
      password 
    } = body;

    // Normalize phone
    const phone = normalizePhone(rawPhone);

    // Validate required fields for CUSTOMER
    if (role === 'CUSTOMER') {
      if (!name || !phone || !address || !kota) {
        return NextResponse.json(
          { message: 'Field wajib: Nama, No HP, Alamat Lengkap, dan Kota harus diisi' },
          { status: 400 }
        );
      }

      // Validasi latitude & longitude (Share Lokasi WAJIB untuk CUSTOMER)
      if (latitude === undefined || longitude === undefined || 
          latitude === null || longitude === null) {
        return NextResponse.json(
          { message: 'Share Lokasi wajib diisi untuk customer (latitude & longitude)' },
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
    } else {
      // For non-customer roles, basic validation
      if (!name || !phone || !role || !password) {
        return NextResponse.json(
          { message: 'Missing required fields' },
          { status: 400 }
        );
      }
    }

    // Email handling (opsional untuk customer)
    let email = (rawEmail || '').trim();
    if (!email) {
      const base = (phone || 'user').replace(/[^a-zA-Z0-9]/g, '');
      email = `${base}-${Date.now()}@jelantahgo.local`;
    }

    // Check if phone already exists
    const existingPhone = await prisma.user.findUnique({
      where: { phone }
    });

    if (existingPhone) {
      return NextResponse.json(
        { message: 'Nomor HP sudah terdaftar' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      );
    }

    // Find referrer if referral code provided
    let referrerId = null;
    if (referredByCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referredByCode }
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with unique referral code
    let newReferralCode = randomUUID().slice(0, 8).toUpperCase();
    let codeExists = true;
    while (codeExists) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: newReferralCode }
      });
      if (!existing) {
        codeExists = false;
      } else {
        newReferralCode = randomUUID().slice(0, 8).toUpperCase();
      }
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        address: address || null,
        kelurahan: kelurahan || null,
        kecamatan: kecamatan || null,
        kota: kota || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        shareLocationUrl: shareLocationUrl || null,
        role,
        password: hashedPassword,
        referralCode: newReferralCode,
        referredById: referrerId,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        kelurahan: true,
        kecamatan: true,
        kota: true,
        latitude: true,
        longitude: true,
        shareLocationUrl: true,
        role: true,
        isActive: true,
        referralCode: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: newUser
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
