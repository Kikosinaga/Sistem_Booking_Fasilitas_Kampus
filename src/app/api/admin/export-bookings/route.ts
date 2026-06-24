'use server'

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: { name: true, email: true, role: true, nim: true, nip: true, organization: true },
        },
        facility: {
          select: { name: true, type: true, pricePerHour: true, location: true },
        },
        payment: {
          select: { amount: true, method: true, status: true, paidAt: true },
        },
        documents: {
          select: { documentType: true, fileName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Aggregate stats
    const totalBookings = bookings.length
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length
    const approvedBookings = bookings.filter(b => ['APPROVED', 'PAID', 'ACTIVE'].includes(b.status)).length
    const rejectedBookings = bookings.filter(b => b.status === 'REJECTED').length
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length
    const totalRevenue = bookings
      .filter(b => b.payment?.status === 'PAID')
      .reduce((sum, b) => sum + (b.payment?.amount || 0), 0)

    return NextResponse.json({
      stats: {
        totalBookings,
        pendingBookings,
        approvedBookings,
        rejectedBookings,
        completedBookings,
        totalRevenue,
      },
      bookings: bookings.map(b => ({
        title: b.title,
        description: b.description,
        organization: b.organization,
        userName: b.user.name,
        userEmail: b.user.email,
        userRole: b.user.role,
        userNim: b.user.nim,
        userNip: b.user.nip,
        userOrganization: b.user.organization,
        facilityName: b.facility.name,
        facilityType: b.facility.type,
        facilityLocation: b.facility.location,
        startTime: b.startTime,
        endTime: b.endTime,
        attendees: b.attendees,
        status: b.status,
        totalPrice: b.totalPrice,
        isFree: b.isFree,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        paidAmount: b.payment?.amount,
        paidAt: b.payment?.paidAt,
        documents: b.documents.map(d => d.documentType),
        createdAt: b.createdAt,
      })),
    })
  } catch (error) {
    console.error('Export bookings error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
