import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
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
        updatedAt: true,
        _count: {
          select: {
            pickupsAsCustomer: true,
            pickupsAsCourier: true,
            referrals: true
          }
        }
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(targetUser);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { name, email, phone, address, role, password } = body;

    // Validate required fields
    if (!name || !email || !phone || !role) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email is unique (excluding current user)
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail && existingEmail.id !== params.id) {
      return NextResponse.json(
        { message: 'Email already exists' },
        { status: 400 }
      );
    }

    const updateData: any = {
      name,
      email,
      phone,
      address: address || null,
      role,
      updatedAt: new Date()
    };

    // Hash password if provided
    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
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
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Prevent deleting the current user
    if (user.id === params.id) {
      return NextResponse.json(
        { message: 'Cannot delete yourself' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user (this will cascade delete related records due to database constraints)
    await prisma.user.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error instanceof Error && error.message.includes('foreign key')) {
      return NextResponse.json(
        { message: 'Cannot delete user with related data. Please delete associated records first.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
