import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return unauthorizedResponse();

  try {
    const stats: any = {};

    if (user.role === 'ADMIN') {
      // Admin dashboard
      const [
        totalUsers,
        totalPickups,
        pendingPickups,
        totalRevenue,
        totalBills
      ] = await Promise.all([
        prisma.user.count(),
        prisma.pickup.count(),
        prisma.pickup.count({ where: { status: 'PENDING' } }),
        prisma.bill.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
        prisma.bill.count({ where: { status: 'UNPAID' } })
      ]);

      stats.totalUsers = totalUsers;
      stats.totalPickups = totalPickups;
      stats.pendingPickups = pendingPickups;
      stats.totalRevenue = totalRevenue._sum.amount || 0;
      stats.unpaidBills = totalBills;
    } else if (user.role === 'CUSTOMER') {
      // Customer dashboard
      const [
        myPickups,
        pendingPickups,
        completedPickups,
        totalSpent,
        unpaidBills
      ] = await Promise.all([
        prisma.pickup.count({ where: { customerId: user.id } }),
        prisma.pickup.count({ where: { customerId: user.id, status: 'PENDING' } }),
        prisma.pickup.count({ where: { customerId: user.id, status: 'COMPLETED' } }),
        prisma.bill.aggregate({ _sum: { amount: true }, where: { userId: user.id, status: 'PAID' } }),
        prisma.bill.count({ where: { userId: user.id, status: 'UNPAID' } })
      ]);

      stats.myPickups = myPickups;
      stats.pendingPickups = pendingPickups;
      stats.completedPickups = completedPickups;
      stats.totalSpent = totalSpent._sum.amount || 0;
      stats.unpaidBills = unpaidBills;
    } else if (user.role === 'COURIER') {
      // Courier dashboard
      const [
        assignedPickups,
        completedPickups,
        totalEarnings,
        pendingCommissions
      ] = await Promise.all([
        prisma.pickup.count({ where: { courierId: user.id, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } } }),
        prisma.pickup.count({ where: { courierId: user.id, status: 'COMPLETED' } }),
        prisma.commission.aggregate({ _sum: { amount: true }, where: { userId: user.id, status: 'PAID' } }),
        prisma.commission.count({ where: { userId: user.id, status: 'PENDING' } })
      ]);

      stats.assignedPickups = assignedPickups;
      stats.completedPickups = completedPickups;
      stats.totalEarnings = totalEarnings._sum.amount || 0;
      stats.pendingCommissions = pendingCommissions;
    } else if (user.role === 'WAREHOUSE') {
      // Warehouse dashboard
      const [
        receivedPickups,
        totalVolume
      ] = await Promise.all([
        prisma.pickup.count({ where: { warehouseId: user.id } }),
        prisma.pickup.aggregate({ _sum: { volume: true }, where: { warehouseId: user.id, status: 'COMPLETED' } })
      ]);

      stats.receivedPickups = receivedPickups;
      stats.totalVolume = totalVolume._sum.volume || 0;
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
