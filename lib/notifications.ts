import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  relatedId?: string
) {
  return await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      relatedId,
    }
  });
}

export async function notifyPickupCreated(pickupId: string, customerId: string) {
  await createNotification(
    customerId,
    'Pickup Berhasil Dibuat',
    'Permintaan pickup Anda telah berhasil dibuat dan menunggu kurir',
    'PICKUP_REQUEST',
    pickupId
  );
}

export async function notifyPickupAssigned(
  pickupId: string,
  customerId: string,
  courierId: string
) {
  await createNotification(
    customerId,
    'Kurir Ditugaskan',
    'Kurir telah ditugaskan untuk pickup Anda',
    'PICKUP_ASSIGNED',
    pickupId
  );

  await createNotification(
    courierId,
    'Pickup Baru',
    'Anda telah ditugaskan untuk pickup baru',
    'PICKUP_ASSIGNED',
    pickupId
  );
}

export async function notifyPickupCompleted(
  pickupId: string,
  customerId: string,
  courierId: string
) {
  await createNotification(
    customerId,
    'Pickup Selesai',
    'Pickup minyak jelantah Anda telah selesai',
    'PICKUP_COMPLETED',
    pickupId
  );

  await createNotification(
    courierId,
    'Komisi Tersedia',
    'Anda telah mendapatkan komisi dari pickup',
    'COMMISSION_EARNED',
    pickupId
  );
}

export async function notifyPaymentDue(billId: string, userId: string, amount: number) {
  await createNotification(
    userId,
    'Tagihan Jatuh Tempo',
    `Tagihan sebesar Rp ${amount.toLocaleString('id-ID')} akan jatuh tempo`,
    'PAYMENT_DUE',
    billId
  );
}
