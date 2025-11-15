import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifyCommissionPaid } from '@/lib/notifications';
import { sendCommissionPaymentEmail } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { status, paymentProof } = body;

    // Get commission
    const commission = await prisma.commission.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        pickup: true
      }
    });

    if (!commission) {
      return NextResponse.json(
        { message: 'Commission not found' },
        { status: 404 }
      );
    }

    // Only ADMIN and WAREHOUSE can update commission status
    if (user.role !== 'ADMIN' && user.role !== 'WAREHOUSE') {
      return NextResponse.json(
        { message: 'Only ADMIN and WAREHOUSE can update commission status' },
        { status: 403 }
      );
    }

    // Update commission
    let updateData: any = {};

    if (status === 'PAID') {
      // Require payment proof
      if (!paymentProof) {
        return NextResponse.json(
          { message: 'Payment proof is required' },
          { status: 400 }
        );
      }

      updateData = {
        status: 'PAID',
        paidDate: new Date(),
        paymentProof
      };

      // Create dashboard notification
      await notifyCommissionPaid(
        commission.id,
        commission.userId,
        commission.amount,
        commission.type as 'COURIER' | 'AFFILIATE'
      );

      // Send email notification
      if (commission.user.email) {
        await sendCommissionPaymentEmail(
          commission.user.email,
          commission.user.name,
          commission.type as 'COURIER' | 'AFFILIATE',
          commission.amount
        );
      }
    } else if (status === 'CANCELLED') {
      updateData = { status: 'CANCELLED' };
    }

    const updatedCommission = await prisma.commission.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        pickup: {
          select: { id: true, scheduledDate: true, volume: true, actualVolume: true }
        }
      }
    });

    return NextResponse.json(updatedCommission);
  } catch (error) {
    console.error('Update commission error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
