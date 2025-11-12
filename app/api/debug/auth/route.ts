import { NextRequest, NextResponse } from 'next/server';
import * as jwt from 'jsonwebtoken';

// Debug endpoint to check JWT configuration
// DELETE THIS FILE in production or add proper authentication
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    const debugInfo: any = {
      hasToken: !!token,
      hasJwtSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      timestamp: new Date().toISOString(),
    };

    if (token && process.env.JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        debugInfo.tokenValid = true;
        debugInfo.tokenData = decoded;
      } catch (error: any) {
        debugInfo.tokenValid = false;
        debugInfo.tokenError = error.message;
      }
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Debug endpoint error',
        message: error.message
      },
      { status: 500 }
    );
  }
}
