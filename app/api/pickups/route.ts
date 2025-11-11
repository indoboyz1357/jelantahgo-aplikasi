import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/pickups - Get all pickups (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let where: any = {};

    // Filter by role
    if (user.role === 'CUSTOMER') {
      where.customerId = user.id;
    } else if (user.role === 'COURIER') {
      where.OR = [
        { courierId: user.id },
        { courierId: null, status: 'PENDING' }
      ];
    } else if (user.role === 'WAREHOUSE') {
      where.status = { in: ['IN_PROGRESS', 'COMPLETED'] };
    }

    // Add status filter if provided
    if (status) {
      where.status = status;
    }

    const pickups = await prisma.pickup.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, address: true }
        },
        courier: {
          select: { id: true, name: true, phone: true }
        },
        warehouse: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(pickups);
  } catch (error) {
    console.error('Get pickups error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/pickups - Create new pickup
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { scheduledDate, volume, notes, latitude, longitude, customerId } = body;

    // Determine target customer
    let targetCustomerId: string | null = null;
    if (user.role === 'CUSTOMER') {
      targetCustomerId = user.id;
    } else if (user.role === 'ADMIN') {
      if (!customerId) {
        return NextResponse.json(
          { message: 'customerId is required for admin-created pickups' },
          { status: 400 }
        );
      }
      // Validate customer exists and is a CUSTOMER
      const customer = await prisma.user.findUnique({ where: { id: customerId }, select: { id: true, role: true } });
      if (!customer || customer.role !== 'CUSTOMER') {
        return NextResponse.json(
          { message: 'Invalid customerId' },
          { status: 400 }
        );
      }
      targetCustomerId = customer.id;
    } else {
      return NextResponse.json(
        { message: 'Only customers or admins can create pickups' },
        { status: 403 }
      );
    }

    if (!scheduledDate || !volume) {
      return NextResponse.json(
        { message: 'Scheduled date and volume are required' },
        { status: 400 }
      );
    }

    const pricePerLiter = 8000; // Fixed price
    const totalPrice = volume * pricePerLiter;
    const courierFee = totalPrice * 0.1; // 10% courier fee

    const pickup = await prisma.pickup.create({
      data: {
        customerId: targetCustomerId!,
        scheduledDate: new Date(scheduledDate),
        volume: parseFloat(volume),
        pricePerLiter,
        totalPrice,
        courierFee,
        affiliateFee: 0,
        notes: notes || null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        status: 'PENDING'
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, address: true }
        }
      }
    });

    // Check if customer has referrer for affiliate fee
    const customer = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referredById: true }
    });

    if (customer?.referredById) {
      pickup.affiliateFee = totalPrice * 0.05; // 5% affiliate fee
      await prisma.pickup.update({
        where: { id: pickup.id },
        data: { affiliateFee: pickup.affiliateFee }
      });
    }

    // Create notification for couriers
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Pickup Request Created',
        message: `Your pickup request for ${volume}L has been created`,
        type: 'PICKUP_REQUEST',
        relatedId: pickup.id
      }
    });

    return NextResponse.json(pickup, { status: 201 });
  } catch (error) {
    console.error('Create pickup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
