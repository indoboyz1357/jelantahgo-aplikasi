import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { normalizePhone } from '@/lib/utils';
import bcrypt from 'bcryptjs';

/**
 * GET /api/admin/customers/[id]
 * Get customer detail by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    const customer = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'CUSTOMER'
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
        lastOrderDate: true,
        createdAt: true,
        updatedAt: true,
        referredBy: {
          select: {
            id: true,
            name: true,
            phone: true,
            referralCode: true
          }
        },
        referrals: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true
          }
        },
        pickupsAsCustomer: {
          select: {
            id: true,
            status: true,
            scheduledDate: true,
            actualVolume: true,
            totalPrice: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        },
        _count: {
          select: {
            pickupsAsCustomer: true,
            referrals: true
          }
        }
      }
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/customers/[id]
 * Update customer by ID
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    // Check if customer exists
    const existingCustomer = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'CUSTOMER'
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
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
      referredById,
      isActive
    } = body;

    // Prepare update data
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (kelurahan !== undefined) updateData.kelurahan = kelurahan || null;
    if (kecamatan !== undefined) updateData.kecamatan = kecamatan || null;
    if (kota !== undefined) updateData.kota = kota;
    if (latitude !== undefined) updateData.latitude = parseFloat(latitude);
    if (longitude !== undefined) updateData.longitude = parseFloat(longitude);
    if (shareLocationUrl !== undefined) updateData.shareLocationUrl = shareLocationUrl || null;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle phone update
    if (phone !== undefined && phone !== existingCustomer.phone) {
      const normalizedPhone = normalizePhone(phone);
      
      // Check if new phone already exists
      const phoneExists = await prisma.user.findFirst({
        where: {
          phone: normalizedPhone,
          id: { not: params.id }
        }
      });

      if (phoneExists) {
        return NextResponse.json(
          { error: 'Phone number already registered' },
          { status: 409 }
        );
      }
      
      updateData.phone = normalizedPhone;
    }

    // Handle email update
    if (email !== undefined) {
      if (email && email !== existingCustomer.email) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email,
            id: { not: params.id }
          }
        });

        if (emailExists) {
          return NextResponse.json(
            { error: 'Email already registered' },
            { status: 409 }
          );
        }
      }
      
      updateData.email = email || null;
    }

    // Handle referredById update
    if (referredById !== undefined) {
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
      
      updateData.referredById = referredById || null;
    }

    // Update customer
    const updatedCustomer = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/customers/[id]
 * Delete customer by ID (soft delete - set isActive to false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    if (user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    // Check if customer exists
    const existingCustomer = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'CUSTOMER'
      }
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has pickups
    const pickupCount = await prisma.pickup.count({
      where: { customerId: params.id }
    });

    if (pickupCount > 0) {
      // Soft delete - just deactivate
      await prisma.user.update({
        where: { id: params.id },
        data: { isActive: false }
      });

      return NextResponse.json({
        message: 'Customer deactivated successfully (has pickup history)',
        deleted: false,
        deactivated: true
      });
    } else {
      // Hard delete - no pickup history
      await prisma.user.delete({
        where: { id: params.id }
      });

      return NextResponse.json({
        message: 'Customer deleted successfully',
        deleted: true
      });
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
