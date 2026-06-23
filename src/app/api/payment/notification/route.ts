import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { coreApi } from '@/lib/midtrans'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Create a transaction object using midtrans client to process the notification
    const notification = await coreApi.transaction.notification(body)

    const orderId = notification.order_id
    const transactionStatus = notification.transaction_status
    const fraudStatus = notification.fraud_status
    
    // Extract booking ID (assuming order_id format is "BOOK-{id}")
    const bookingId = orderId.replace('BOOK-', '')

    const payment = await prisma.payment.findUnique({
      where: { bookingId },
      include: { booking: true }
    })

    if (!payment) {
      return NextResponse.json({ message: 'Payment not found' }, { status: 404 })
    }

    let paymentStatus = payment.status
    let bookingStatus = payment.booking.status

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'challenge') {
        paymentStatus = 'PENDING'
      } else if (fraudStatus === 'accept') {
        paymentStatus = 'PAID'
        // If booking is pending, admin still needs to approve it, but payment is successful
        // Or we can auto-approve it here depending on business logic
      }
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'PAID'
    } else if (
      transactionStatus === 'cancel' ||
      transactionStatus === 'deny' ||
      transactionStatus === 'expire'
    ) {
      paymentStatus = 'FAILED'
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'PENDING'
    }

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: paymentStatus as any,
        metadata: body,
        paidAt: paymentStatus === 'PAID' ? new Date() : undefined,
      }
    })

    // Update booking status and generate access code if paid
    if (paymentStatus === 'PAID') {
      await prisma.$transaction(async (tx) => {
        // Update booking status to APPROVED and paymentStatus to PAID
        await tx.booking.update({
          where: { id: bookingId },
          data: { 
            paymentStatus: 'PAID',
            status: 'APPROVED'
          }
        })

        // Generate QR code if it doesn't already exist
        const existingQR = await tx.qRVerification.findUnique({
          where: { bookingId }
        })
        if (!existingQR) {
          await tx.qRVerification.create({
            data: {
              bookingId,
              code: `BK-${bookingId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
            }
          })
        }
      })
      
      // Create notification for admin
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      })

      await prisma.notification.createMany({
        data: admins.map((admin: { id: string }) => ({
          userId: admin.id,
          title: 'Pembayaran Diterima',
          message: `Pembayaran untuk booking "${payment.booking.title}" telah berhasil terverifikasi. Akses fasilitas diberikan.`,
          type: 'PAYMENT_RECEIVED',
          bookingId: bookingId,
        })),
      })

      // Create notification for user
      await prisma.notification.create({
        data: {
          userId: payment.booking.userId,
          title: 'Pembayaran Berhasil',
          message: `Pembayaran untuk booking "${payment.booking.title}" telah berhasil. Tiket QR Code Anda telah diterbitkan.`,
          type: 'PAYMENT_RECEIVED',
          bookingId: bookingId,
        }
      })
    } else if (paymentStatus === 'FAILED') {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: 'FAILED' }
      })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('Midtrans notification error:', error)
    return NextResponse.json({ message: 'Error processing notification' }, { status: 500 })
  }
}
