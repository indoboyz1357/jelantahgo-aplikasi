import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { notifyBillPaid } from '@/lib/notifications';
import { sendPaymentReceivedEmail } from '@/lib/email';

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

    // Get bill
    const bill = await prisma.bill.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!bill) {
      return NextResponse.json(
        { message: 'Bill not found' },
        { status: 404 }
      );
    }

    // Check permission
    // ADMIN and WAREHOUSE can mark bills as paid
    // CUSTOMER can only view their own bills
    if (user.role === 'CUSTOMER' && bill.userId !== user.id) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Only ADMIN and WAREHOUSE can update bill status
    if (status && user.role !== 'ADMIN' && user.role !== 'WAREHOUSE') {
      return NextResponse.json(
        { message: 'Only ADMIN and WAREHOUSE can update bill status' },
        { status: 403 }
      );
    }

    // Update bill
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
      await notifyBillPaid(bill.id, bill.userId, bill.amount, bill.invoiceNumber);

      // Send email notification
      if (bill.user.email) {
        await sendPaymentReceivedEmail(
          bill.user.email,
          bill.user.name,
          bill.invoiceNumber,
          bill.amount,
          'BILL'
        );
      }
    } else if (status === 'CANCELLED') {
      updateData = { status: 'CANCELLED' };
    }

    const updatedBill = await prisma.bill.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        pickup: {
          select: { id: true, scheduledDate: true, volume: true }
        }
      }
    });

    return NextResponse.json(updatedBill);
  } catch (error) {
    console.error('Update bill error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
