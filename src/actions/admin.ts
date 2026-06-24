'use server'

import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { snap } from '@/lib/midtrans'

// Get all bookings (admin)
export async function getAllBookings(status?: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return []
  }

  return await prisma.booking.findMany({
    where: status && status !== 'ALL' ? { status: status as any } : undefined,
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, nim: true, organization: true },
      },
      facility: {
        select: { id: true, name: true, slug: true, type: true, pricePerHour: true },
      },
      payment: true,
      documents: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Approve booking (admin)
export async function approveBooking(bookingId: string, note?: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { facility: true, user: true },
  })

  if (!booking) return { error: 'Booking tidak ditemukan' }
  if (booking.status !== 'PENDING') return { error: 'Booking sudah diproses' }

  const isFree = booking.isFree

  let snapToken: string | null = null
  let paymentUrl: string | null = null
  let orderId: string | null = null

  // If paid booking, generate Midtrans snap token
  if (!isFree && booking.totalPrice > 0) {
    try {
      orderId = `BOOK-${booking.id}-${Date.now()}`
      const hours = Math.ceil(
        (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60)
      )
      const parameter = {
        transaction_details: {
          order_id: orderId,
          gross_amount: booking.totalPrice,
        },
        customer_details: {
          first_name: booking.user.name,
          email: booking.user.email,
        },
        item_details: [
          {
            id: booking.facility.id,
            price: booking.facility.pricePerHour,
            quantity: hours,
            name: booking.facility.name,
          }
        ]
      }

      const transaction = await snap.createTransaction(parameter)
      snapToken = transaction.token
      paymentUrl = transaction.redirect_url
    } catch (err) {
      console.error('Midtrans Snap error during approval:', err)
    }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'APPROVED',
        adminNote: note,
        paymentStatus: isFree ? 'PAID' : 'UNPAID',
      },
    })

    // Create payment record if it's a paid booking
    if (!isFree && booking.totalPrice > 0) {
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: booking.totalPrice,
          method: booking.paymentMethod || 'BANK_TRANSFER',
          status: 'PENDING',
          snapToken,
          paymentUrl,
          transactionId: orderId,
        }
      })
    }

    // Notify user
    await tx.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Disetujui',
        message: `Booking "${booking.title}" untuk ${booking.facility.name} telah disetujui.${
          isFree ? '' : ' Silakan lakukan pembayaran.'
        }`,
        type: 'BOOKING_APPROVED',
        bookingId,
      },
    })
  })

  revalidatePath('/admin/bookings')
  revalidatePath('/dashboard')

  return { success: true }
}

// Reject booking (admin)
export async function rejectBooking(bookingId: string, note?: string) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { facility: true },
  })

  if (!booking) return { error: 'Booking tidak ditemukan' }
  if (booking.status !== 'PENDING' && booking.status !== 'APPROVED') {
    return { error: 'Booking tidak dapat ditolak pada status ini' }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: 'REJECTED',
        adminNote: note || 'Ditolak oleh admin',
      },
    })

    // Also cancel the payment record if it exists and is unpaid
    const payment = await tx.payment.findUnique({
      where: { bookingId }
    })
    if (payment && payment.status !== 'PAID') {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      })
    }

    // Notify user
    await tx.notification.create({
      data: {
        userId: booking.userId,
        title: 'Booking Ditolak',
        message: `Booking "${booking.title}" untuk ${booking.facility.name} ditolak oleh admin. Alasan: ${note || 'Ditolak oleh admin'}`,
        type: 'BOOKING_REJECTED',
        bookingId,
      },
    })
  })

  revalidatePath('/admin/bookings')
  revalidatePath('/dashboard')

  return { success: true }
}

// Get dashboard stats (admin)
export async function getDashboardStats() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return null
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalBookings,
    pendingBookings,
    activeBookings,
    totalUsers,
    totalFacilities,
    monthlyBookings,
    lastMonthBookings,
    totalRevenue,
    monthlyRevenue,
    recentBookings,
    bookingsByFacility,
    bookingsByStatus,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.count({ where: { status: { in: ['APPROVED', 'PAID', 'ACTIVE'] } } }),
    prisma.user.count(),
    prisma.facility.count({ where: { isActive: true } }),
    prisma.booking.count({
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'PAID',
        paidAt: { gte: startOfMonth },
      },
    }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, role: true } },
        facility: { select: { name: true } },
      },
    }),
    prisma.booking.groupBy({
      by: ['facilityId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 6,
    }),
    prisma.booking.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
  ])

  // Get facility names for chart
  const facilityIds = bookingsByFacility.map((b: { facilityId: string; _count: { id: number } }) => b.facilityId)
  const facilities = await prisma.facility.findMany({
    where: { id: { in: facilityIds } },
    select: { id: true, name: true },
  })

  const facilityChart = bookingsByFacility.map((b: { facilityId: string; _count: { id: number } }) => ({
    name: facilities.find((f: { id: string; name: string }) => f.id === b.facilityId)?.name || 'Unknown',
    value: b._count.id,
  }))

  const statusChart = bookingsByStatus.map((b: { status: string; _count: { id: number } }) => ({
    name: b.status,
    value: b._count.id,
  }))

  // Calculate trends
  const bookingTrend = lastMonthBookings > 0
    ? ((monthlyBookings - lastMonthBookings) / lastMonthBookings) * 100
    : monthlyBookings > 0
    ? 100
    : 0

  return {
    totalBookings,
    pendingBookings,
    activeBookings,
    totalUsers,
    totalFacilities,
    monthlyBookings,
    totalRevenue: totalRevenue._sum.amount || 0,
    monthlyRevenue: monthlyRevenue._sum.amount || 0,
    bookingTrend: Math.round(bookingTrend),
    recentBookings,
    facilityChart,
    statusChart,
  }
}

// Get all users (admin)
export async function getAllUsers() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return []
  }

  return await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      nim: true,
      nip: true,
      phone: true,
      organization: true,
      isActive: true,
      createdAt: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Manage facility (admin)
export async function createFacility(formData: FormData) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const type = formData.get('type') as string
  const description = formData.get('description') as string
  const capacity = parseInt(formData.get('capacity') as string)
  const location = formData.get('location') as string
  const pricePerHour = parseFloat(formData.get('pricePerHour') as string)
  const openTime = formData.get('openTime') as string
  const closeTime = formData.get('closeTime') as string

  try {
    await prisma.facility.create({
      data: {
        name,
        slug,
        type: type as any,
        description,
        capacity,
        location,
        pricePerHour,
        openTime: openTime || '08:00',
        closeTime: closeTime || '22:00',
        images: [],
        amenities: [],
      },
    })

    revalidatePath('/admin/facilities')
    return { success: true }
  } catch (error) {
    return { error: 'Gagal membuat fasilitas' }
  }
}

// Get notifications
export async function getNotifications() {
  const session = await auth()
  if (!session?.user) return []

  return await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
}

// Mark notification as read
export async function markNotificationRead(notificationId: string) {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
  revalidatePath('/dashboard')
  revalidatePath('/admin/dashboard')
}

// Get unread notification count
export async function getUnreadNotificationCount() {
  const session = await auth()
  if (!session?.user) return 0

  return await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })
}
