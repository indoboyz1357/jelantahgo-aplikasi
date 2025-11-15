import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/settings - Get settings (anyone authenticated)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    // Get or create settings
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: {}
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return unauthorizedResponse();

    if (user.role !== 'ADMIN') {
      return forbiddenResponse();
    }

    const body = await request.json();

    // Get or create settings
    let settings = await prisma.settings.findFirst();

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.settings.create({
        data: body
      });
    } else {
      // Update existing
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: body
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
