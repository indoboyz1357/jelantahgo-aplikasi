import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { normalizePhone } from '@/lib/utils';

const prisma = new PrismaClient();

function generateReferralCode() {
  return 'REF' + Math.random().toString(36).substring(2, 9).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const { 
      email: rawEmail, 
      password: rawPassword, 
      name, 
      phone: rawPhone, 
      address,
      referralCode
    } = await request.json();

    // Basic required fields: name and phone mandatory for admin inline registration
    const phone = normalizePhone(rawPhone);
    if (!name || !phone) {
      return NextResponse.json(
        { message: 'Name dan Phone wajib diisi' },
        { status: 400 }
      );
    }

    // Normalize/generate email if not provided
    let email = (rawEmail || '').trim();
    if (!email) {
      const base = (phone || 'user').replace(/[^a-zA-Z0-9]/g, '');
      email = `${base}-${Date.now()}@jelantahgo.local`;
    }

    // Generate password if not provided
    let password = rawPassword;
    if (!password) {
      password = Math.random().toString(36).slice(-10) + 'A1!';
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar' },
        { status: 400 }
      );
    }

    // Find referrer if code provided
    let referrerId = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      
      if (referrer) {
        referrerId = referrer.id;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code
    let newReferralCode = generateReferralCode();
    let codeExists = await prisma.user.findUnique({
      where: { referralCode: newReferralCode }
    });
    
    while (codeExists) {
      newReferralCode = generateReferralCode();
      codeExists = await prisma.user.findUnique({ where: { referralCode: newReferralCode } });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        address,
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
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone, address: user.address, role: user.role },
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
