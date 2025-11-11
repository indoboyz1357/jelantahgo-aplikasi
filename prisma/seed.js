const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.commission.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.pickup.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleared existing data');

  // Hash password
  const hashedPassword = await bcrypt.hash('demo123', 10);

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@jelantahgo.com',
      password: hashedPassword,
      name: 'Admin JelantahGO',
      phone: '081234567890',
      address: 'Kantor Pusat JelantahGO',
      role: 'ADMIN',
      referralCode: 'ADMIN001',
    }
  });

  // Create Customers
  const customer1 = await prisma.user.create({
    data: {
      email: 'customer1@jelantahgo.com',
      password: hashedPassword,
      name: 'Ibu Siti (Warung Makan)',
      phone: '081234567891',
      address: 'Jl. Raya Bogor No. 123, Jakarta',
      role: 'CUSTOMER',
      referralCode: 'CUST001',
    }
  });

  const customer2 = await prisma.user.create({
    data: {
      email: 'customer2@jelantahgo.com',
      password: hashedPassword,
      name: 'Pak Budi (Restoran)',
      phone: '081234567892',
      address: 'Jl. Sudirman No. 456, Jakarta',
      role: 'CUSTOMER',
      referralCode: 'CUST002',
      referredById: customer1.id,
    }
  });

  // Create Courier
  const courier = await prisma.user.create({
    data: {
      email: 'courier@jelantahgo.com',
      password: hashedPassword,
      name: 'Ahmad (Kurir)',
      phone: '081234567893',
      address: 'Jakarta Timur',
      role: 'COURIER',
      referralCode: 'COUR001',
    }
  });

  // Create Warehouse
  const warehouse = await prisma.user.create({
    data: {
      email: 'warehouse@jelantahgo.com',
      password: hashedPassword,
      name: 'Gudang Pusat',
      phone: '081234567894',
      address: 'Kawasan Industri, Jakarta',
      role: 'WAREHOUSE',
      referralCode: 'WARE001',
    }
  });

  console.log('✅ Users created');

  // Create Pickups
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const pickup1 = await prisma.pickup.create({
    data: {
      customerId: customer1.id,
      courierId: courier.id,
      warehouseId: warehouse.id,
      status: 'COMPLETED',
      scheduledDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      actualDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      volume: 50,
      pricePerLiter: 8000,
      totalPrice: 400000,
      courierFee: 40000,
      affiliateFee: 0,
      notes: 'Pickup pertama dari Warung Ibu Siti',
      latitude: -6.2088,
      longitude: 106.8456,
    }
  });

  const pickup2 = await prisma.pickup.create({
    data: {
      customerId: customer2.id,
      courierId: courier.id,
      status: 'IN_PROGRESS',
      scheduledDate: now,
      volume: 30,
      pricePerLiter: 8000,
      totalPrice: 240000,
      courierFee: 24000,
      affiliateFee: 12000,
      notes: 'Pickup dari Restoran Pak Budi (referral)',
      latitude: -6.2088,
      longitude: 106.8456,
    }
  });

  const pickup3 = await prisma.pickup.create({
    data: {
      customerId: customer1.id,
      status: 'PENDING',
      scheduledDate: tomorrow,
      volume: 40,
      pricePerLiter: 8000,
      totalPrice: 320000,
      courierFee: 32000,
      affiliateFee: 0,
      notes: 'Pickup terjadwal besok',
      latitude: -6.2088,
      longitude: 106.8456,
    }
  });

  console.log('✅ Pickups created');

  // Create Bills
  const bill1 = await prisma.bill.create({
    data: {
      pickupId: pickup1.id,
      userId: customer1.id,
      amount: 400000,
      status: 'PAID',
      dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      paidDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-2024-001',
    }
  });

  const bill2 = await prisma.bill.create({
    data: {
      pickupId: pickup2.id,
      userId: customer2.id,
      amount: 240000,
      status: 'UNPAID',
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      invoiceNumber: 'INV-2024-002',
    }
  });

  console.log('✅ Bills created');

  // Create Commissions
  await prisma.commission.create({
    data: {
      pickupId: pickup1.id,
      userId: courier.id,
      type: 'COURIER',
      amount: 40000,
      status: 'PAID',
      paidDate: new Date(),
    }
  });

  await prisma.commission.create({
    data: {
      pickupId: pickup2.id,
      userId: courier.id,
      type: 'COURIER',
      amount: 24000,
      status: 'PENDING',
    }
  });

  await prisma.commission.create({
    data: {
      pickupId: pickup2.id,
      userId: customer1.id,
      type: 'AFFILIATE',
      amount: 12000,
      status: 'PENDING',
    }
  });

  console.log('✅ Commissions created');

  // Create Notifications
  await prisma.notification.create({
    data: {
      userId: customer1.id,
      title: 'Pickup Selesai',
      message: 'Pickup minyak jelantah Anda telah selesai',
      type: 'PICKUP_COMPLETED',
      relatedId: pickup1.id,
      isRead: true,
    }
  });

  await prisma.notification.create({
    data: {
      userId: courier.id,
      title: 'Pickup Baru',
      message: 'Ada pickup baru menunggu untuk diambil',
      type: 'PICKUP_REQUEST',
      relatedId: pickup3.id,
      isRead: false,
    }
  });

  await prisma.notification.create({
    data: {
      userId: customer2.id,
      title: 'Tagihan Baru',
      message: 'Tagihan untuk pickup telah tersedia',
      type: 'PAYMENT_DUE',
      relatedId: bill2.id,
      isRead: false,
    }
  });

  console.log('✅ Notifications created');

  // Create Messages
  await prisma.message.create({
    data: {
      pickupId: pickup2.id,
      senderId: customer2.id,
      receiverId: courier.id,
      content: 'Halo, saya siap untuk pickup hari ini',
      isRead: true,
    }
  });

  await prisma.message.create({
    data: {
      pickupId: pickup2.id,
      senderId: courier.id,
      receiverId: customer2.id,
      content: 'Baik, saya akan segera menuju lokasi Anda',
      isRead: false,
    }
  });

  console.log('✅ Messages created');

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📧 Login credentials:');
  console.log('Admin: admin@jelantahgo.com / demo123');
  console.log('Customer 1: customer1@jelantahgo.com / demo123');
  console.log('Customer 2: customer2@jelantahgo.com / demo123');
  console.log('Courier: courier@jelantahgo.com / demo123');
  console.log('Warehouse: warehouse@jelantahgo.com / demo123\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
