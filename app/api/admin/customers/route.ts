import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { normalizePhone, generateReferralCode } from '@/lib/utils';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/customers
 * Get list of customers with pagination and search
 */
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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    let where: any = {
      role: 'CUSTOMER'
    };

    if (search) {
      const normalizedPhone = normalizePhone(search);
      const phoneCandidates = [normalizedPhone, search];
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { kota: { contains: search, mode: 'insensitive' } },
        { phone: { in: phoneCandidates } }
      ];
    }

    const [customersData, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          referredById: true,
          referralCode: true,
          isActive: true,
          lastOrderDate: true,
          createdAt: true,
          updatedAt: true,
          referredBy: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          _count: {
            select: {
              pickupsAsCustomer: true,
              referrals: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Enrich customers with analytics data
    const customersWithAnalytics = await Promise.all(
      customersData.map(async (customer) => {
        // Get total volume from completed pickups
        const totalVolumeResult = await prisma.pickup.aggregate({
          where: {
            customerId: customer.id,
            status: 'COMPLETED'
          },
          _sum: {
            actualVolume: true
          }
        });

        // Get downline IDs
        const downlineIds = await prisma.user.findMany({
          where: { referredById: customer.id },
          select: { id: true }
        });

        // Get total volume from downline's completed pickups
        let downlineTotalVolume = 0;
        if (downlineIds.length > 0) {
          const downlineVolumeResult = await prisma.pickup.aggregate({
            where: {
              customerId: { in: downlineIds.map(d => d.id) },
              status: 'COMPLETED'
            },
            _sum: {
              actualVolume: true
            }
          });
          downlineTotalVolume = downlineVolumeResult._sum.actualVolume || 0;
        }

        return {
          ...customer,
          totalVolume: totalVolumeResult._sum.actualVolume || 0,
          downlineCount: customer._count.referrals,
          downlineTotalVolume
        };
      })
    );

    return NextResponse.json({
      customers: customersWithAnalytics,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/customers
 * Create new customer by admin
 */
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
      phone,
      email,
      address,
      kelurahan,
      kecamatan,
      kota,
      latitude,
      longitude,
      shareLocationUrl,
      referredById
    } = body;

    // Validasi field wajib
    if (!name || !phone || !address || !kota) {
      return NextResponse.json(
        { error: 'Name, phone, address, and kota are required' },
        { status: 400 }
      );
    }

    // Validasi lokasi (latitude & longitude wajib)
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Location (latitude and longitude) is required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = normalizePhone(phone);

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 409 }
      );
    }

    // Check if email already exists (jika email diisi)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        );
      }
    }

    // Validasi referredById jika ada
    if (referredById) {
      const referrer = await prisma.user.findUnique({
        where: { id: referredById }
      });

      if (!referrer) {
        return NextResponse.json(
          { error: 'Referrer not found' },
          { status: 404 }
        );
      }
    }

    // Generate default password (phone number without leading 0 or +62)
    const defaultPassword = normalizedPhone.replace(/^(\+62|62|0)/, '');
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Generate unique referral code
    const referralCode = await generateReferralCode();

    // Create customer
    const customer = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        email: email || null,
        address,
        kelurahan: kelurahan || null,
        kecamatan: kecamatan || null,
        kota,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        shareLocationUrl: shareLocationUrl || null,
        password: hashedPassword,
        role: 'CUSTOMER',
        referralCode,
        referredById: referredById || null,
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
        referralCode: true,
        referredById: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        referredBy: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Customer created successfully',
      customer,
      defaultPassword // Return password untuk diberitahu ke customer
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}
