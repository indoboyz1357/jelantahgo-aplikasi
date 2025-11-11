import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/pickups/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    const pickup = await prisma.pickup.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: { id: true, name: true, phone: true, address: true, email: true }
        },
        courier: {
          select: { id: true, name: true, phone: true }
        },
        warehouse: {
          select: { id: true, name: true }
        },
        bills: true,
        commissions: true,
        messages: {
          include: {
            sender: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!pickup) {
      return NextResponse.json(
        { message: 'Pickup not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pickup);
  } catch (error) {
    console.error('Get pickup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/pickups/[id] - Update pickup status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { status, courierId, warehouseId } = body;

    const pickup = await prisma.pickup.findUnique({
      where: { id: params.id }
    });

    if (!pickup) {
      return NextResponse.json(
        { message: 'Pickup not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};

    // Handle status updates based on role
    if (status) {
      if (status === 'ASSIGNED' && user.role === 'COURIER') {
        updateData = {
          status: 'ASSIGNED',
          courierId: user.id
        };
      } else if (status === 'IN_PROGRESS' && user.role === 'COURIER' && pickup.courierId === user.id) {
        updateData = {
          status: 'IN_PROGRESS',
          actualDate: new Date()
        };
      } else if (status === 'COMPLETED' && user.role === 'WAREHOUSE') {
        updateData = {
          status: 'COMPLETED',
          warehouseId: user.id
        };

        // Create bill when completed
        const invoiceNumber = `INV-${Date.now()}`;
        
        await prisma.bill.create({
          data: {
            pickupId: pickup.id,
            userId: pickup.customerId,
            amount: pickup.totalPrice,
            status: 'UNPAID',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            invoiceNumber
          }
        });

        // Create commissions
        if (pickup.courierId) {
          await prisma.commission.create({
            data: {
              pickupId: pickup.id,
              userId: pickup.courierId,
              type: 'COURIER',
              amount: pickup.courierFee,
              status: 'PENDING'
            }
          });
        }

        if (pickup.affiliateFee > 0) {
          const customer = await prisma.user.findUnique({
            where: { id: pickup.customerId },
            select: { referredById: true }
          });

          if (customer?.referredById) {
            await prisma.commission.create({
              data: {
                pickupId: pickup.id,
                userId: customer.referredById,
                type: 'AFFILIATE',
                amount: pickup.affiliateFee,
                status: 'PENDING'
              }
            });
          }
        }

        // Create notification
        await prisma.notification.create({
          data: {
            userId: pickup.customerId,
            title: 'Pickup Completed',
            message: `Your pickup has been completed. Invoice: ${invoiceNumber}`,
            type: 'PICKUP_COMPLETED',
            relatedId: pickup.id
          }
        });
      } else if (status === 'CANCELLED' && (user.role === 'CUSTOMER' || user.role === 'ADMIN')) {
        updateData = { status: 'CANCELLED' };
      }
    }

    const updatedPickup = await prisma.pickup.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        courier: { select: { id: true, name: true, phone: true } },
        warehouse: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(updatedPickup);
  } catch (error) {
    console.error('Update pickup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
