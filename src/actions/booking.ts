'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { snap } from '@/lib/midtrans'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

// Get all facilities
export async function getFacilities() {
  return await prisma.facility.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

// Get facility by slug
export async function getFacilityBySlug(slug: string) {
  return await prisma.facility.findUnique({
    where: { slug },
    include: {
      bookings: {
        where: {
          status: { in: ['APPROVED', 'PAID', 'ACTIVE'] },
          endTime: { gte: new Date() },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      },
    },
  })
}

// Check booking conflicts
export async function checkBookingConflict(
  facilityId: string,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string
) {
  const conflicts = await prisma.booking.findMany({
    where: {
      facilityId,
      status: { in: ['PENDING', 'APPROVED', 'PAID', 'ACTIVE'] },
      id: excludeBookingId ? { not: excludeBookingId } : undefined,
      OR: [
        {
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      ],
    },
    include: {
      user: { select: { name: true } },
      facility: { select: { name: true } },
    },
  })

  return conflicts
}

// Create a new booking
export async function createBooking(formData: FormData) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Anda harus login terlebih dahulu' }
  }

  const facilityId = formData.get('facilityId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const organization = formData.get('organization') as string
  const startTime = new Date(formData.get('startTime') as string)
  const endTime = new Date(formData.get('endTime') as string)
  const attendees = parseInt(formData.get('attendees') as string) || 0

  // Document uploads
  const ktmFileName = formData.get('ktmFileName') as string | null
  const ktmFileUrl = formData.get('ktmFileUrl') as string | null
  const ktmFileSize = formData.get('ktmFileSize') as string | null
  const ktmMimeType = formData.get('ktmMimeType') as string | null

  const proposalFileName = formData.get('proposalFileName') as string | null
  const proposalFileUrl = formData.get('proposalFileUrl') as string | null
  const proposalFileSize = formData.get('proposalFileSize') as string | null
  const proposalMimeType = formData.get('proposalMimeType') as string | null

  const paymentProofFileName = formData.get('paymentProofFileName') as string | null
  const paymentProofFileUrl = formData.get('paymentProofFileUrl') as string | null
  const paymentProofFileSize = formData.get('paymentProofFileSize') as string | null
  const paymentProofMimeType = formData.get('paymentProofMimeType') as string | null

  const selectedPaymentMethod = formData.get('paymentMethod') as string | null

  // Validation
  if (!facilityId || !title || !startTime || !endTime) {
    return { error: 'Semua field wajib harus diisi' }
  }

  if (startTime >= endTime) {
    return { error: 'Waktu mulai harus sebelum waktu selesai' }
  }

  if (startTime < new Date()) {
    return { error: 'Waktu booking tidak boleh di masa lalu' }
  }

  // Validate mahasiswa documents
  if (session.user.role === 'MAHASISWA') {
    if (!ktmFileUrl) {
      return { error: 'Upload KTM wajib untuk mahasiswa' }
    }
    if (!proposalFileUrl) {
      return { error: 'Upload Proposal Kegiatan wajib untuk mahasiswa' }
    }
  }

  // Validate eksternal payment
  if (session.user.role === 'EKSTERNAL') {
    if (!selectedPaymentMethod) {
      return { error: 'Pilih metode pembayaran terlebih dahulu' }
    }
  }

  // Check conflict
  const conflicts = await checkBookingConflict(facilityId, startTime, endTime)
  if (conflicts.length > 0) {
    return {
      error: `Jadwal bentrok dengan booking "${conflicts[0].title}" (${conflicts[0].user.name})`,
    }
  }

  // Get facility for pricing
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  })

  if (!facility) {
    return { error: 'Fasilitas tidak ditemukan' }
  }

  // Calculate price
  const hours = Math.ceil(
    (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
  )
  const isFree = session.user.role === 'MAHASISWA' || session.user.role === 'DOSEN'
  const totalPrice = isFree ? 0 : hours * facility.pricePerHour

  try {
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          userId: session.user!.id,
          facilityId,
          title,
          description,
          organization,
          startTime,
          endTime,
          attendees,
          totalPrice,
          isFree,
          paymentStatus: isFree ? 'PAID' : 'UNPAID',
          paymentMethod: selectedPaymentMethod as any || (isFree ? 'FREE' : null),
        },
      })

      // Create document records
      const documents: Array<{
        bookingId: string
        fileName: string
        fileUrl: string
        fileSize: number | null
        mimeType: string | null
        documentType: 'KTM' | 'PROPOSAL' | 'PAYMENT_PROOF'
      }> = []

      if (ktmFileUrl && ktmFileName) {
        documents.push({
          bookingId: newBooking.id,
          fileName: ktmFileName,
          fileUrl: ktmFileUrl,
          fileSize: ktmFileSize ? parseInt(ktmFileSize) : null,
          mimeType: ktmMimeType,
          documentType: 'KTM',
        })
      }

      if (proposalFileUrl && proposalFileName) {
        documents.push({
          bookingId: newBooking.id,
          fileName: proposalFileName,
          fileUrl: proposalFileUrl,
          fileSize: proposalFileSize ? parseInt(proposalFileSize) : null,
          mimeType: proposalMimeType,
          documentType: 'PROPOSAL',
        })
      }

      if (documents.length > 0) {
        await tx.document.createMany({ data: documents })
      }

      return newBooking
    })

    // Create notification for admin
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })

    await prisma.notification.createMany({
      data: admins.map((admin: { id: string }) => ({
        userId: admin.id,
        title: 'Booking Baru',
        message: `Booking baru "${title}" untuk ${facility.name} dari ${session.user?.name}`,
        type: 'BOOKING_SUBMITTED' as const,
        bookingId: booking.id,
      })),
    })

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Booking Diajukan',
        message: `Booking "${title}" untuk ${facility.name} sedang menunggu persetujuan admin.`,
        type: 'BOOKING_SUBMITTED',
        bookingId: booking.id,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/admin/bookings')

    return { 
      success: true, 
      bookingId: booking.id,
    }
  } catch (error) {
    console.error('Booking error:', error)
    return { error: 'Gagal membuat booking. Silakan coba lagi.' }
  }
}



// Get user's bookings
export async function getUserBookings() {
  const session = await auth()
  if (!session?.user) return []

  return await prisma.booking.findMany({
    where: { userId: session.user.id },
    include: {
      facility: true,
      payment: true,
      documents: true,
      qrVerification: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// Get booking by ID
export async function getBookingById(id: string) {
  return await prisma.booking.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, nim: true, phone: true, organization: true },
      },
      facility: true,
      payment: true,
      documents: true,
      qrVerification: true,
    },
  })
}

// Cancel booking
export async function cancelBooking(bookingId: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Anda harus login terlebih dahulu' }
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  })

  if (!booking) {
    return { error: 'Booking tidak ditemukan' }
  }

  if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return { error: 'Anda tidak memiliki akses untuk membatalkan booking ini' }
  }

  if (['COMPLETED', 'CANCELLED', 'ACTIVE'].includes(booking.status)) {
    return { error: 'Booking tidak dapat dibatalkan' }
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
  })

  revalidatePath('/dashboard')
  revalidatePath('/admin/bookings')

  return { success: true }
}

// Get or create Midtrans Snap Token on demand
export async function getOrCreateSnapToken(bookingId: string) {
  const session = await auth()
  if (!session?.user) {
    return { error: 'Anda harus login terlebih dahulu' }
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { facility: true, user: true, payment: true },
  })

  if (!booking) {
    return { error: 'Booking tidak ditemukan' }
  }

  // Ensure this booking belongs to the logged in user
  if (booking.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return { error: 'Akses ditolak' }
  }

  if (booking.isFree || booking.totalPrice <= 0) {
    return { error: 'Booking ini gratis, tidak memerlukan pembayaran' }
  }


  // Generate a new one if it failed or does not exist
  const orderId = `BOOK-${booking.id}-${Date.now()}`
  const hours = Math.ceil(
    (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60)
  )

  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') || 'http'
    const appUrl = `${protocol}://${host}`

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
      ],
      callbacks: {
        finish: `${appUrl}/dashboard`,
        error: `${appUrl}/dashboard`,
        pending: `${appUrl}/dashboard`
      }
    }

    const transaction = await snap.createTransaction(parameter)
    const snapToken = transaction.token
    const paymentUrl = transaction.redirect_url

    if (booking.payment) {
      // Update existing payment record
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: {
          snapToken,
          paymentUrl,
          transactionId: orderId,
        }
      })
    } else {
      // Create new payment record if it didn't exist
      await prisma.payment.create({
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

    return { snapToken }
  } catch (err: any) {
    console.error('Midtrans Snap generation error:', err)
    return { error: `Gagal terhubung ke Midtrans: ${err.message || 'Error koneksi'}` }
  }
}
