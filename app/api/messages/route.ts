import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const pickupId = searchParams.get('pickupId');

    if (!pickupId) {
      return NextResponse.json(
        { message: 'Pickup ID required' },
        { status: 400 }
      );
    }

    // Check if user has access to this pickup
    const pickup = await prisma.pickup.findUnique({
      where: { id: pickupId }
    });

    if (!pickup) {
      return NextResponse.json(
        { message: 'Pickup not found' },
        { status: 404 }
      );
    }

    const hasAccess = 
      pickup.customerId === user.id ||
      pickup.courierId === user.id ||
      pickup.warehouseId === user.id ||
      user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { pickupId },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        pickupId,
        receiverId: user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
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

    const body = await request.json();
    const { pickupId, receiverId, content } = body;

    if (!pickupId || !receiverId || !content) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify pickup access
    const pickup = await prisma.pickup.findUnique({
      where: { id: pickupId }
    });

    if (!pickup) {
      return NextResponse.json(
        { message: 'Pickup not found' },
        { status: 404 }
      );
    }

    const hasAccess = 
      pickup.customerId === user.id ||
      pickup.courierId === user.id ||
      pickup.warehouseId === user.id ||
      user.role === 'ADMIN';

    if (!hasAccess) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        pickupId,
        senderId: user.id,
        receiverId,
        content
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true }
        },
        receiver: {
          select: { id: true, name: true, role: true }
        }
      }
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
