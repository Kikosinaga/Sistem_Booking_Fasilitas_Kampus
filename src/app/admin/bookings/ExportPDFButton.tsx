'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import styles from './bookings.module.css'

interface BookingData {
  title: string
  userName: string
  userRole: string
  userNim: string | null
  userNip: string | null
  userOrganization: string | null
  facilityName: string
  facilityType: string
  facilityLocation: string
  startTime: string
  endTime: string
  attendees: number | null
  status: string
  totalPrice: number
  isFree: boolean
  paymentStatus: string
  paymentMethod: string | null
  createdAt: string
}

interface ExportResponse {
  stats: {
    totalBookings: number
    pendingBookings: number
    approvedBookings: number
    rejectedBookings: number
    completedBookings: number
    totalRevenue: number
  }
  bookings: BookingData[]
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  PAID: 'Sudah Dibayar',
  ACTIVE: 'Sedang Berlangsung',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  MAHASISWA: 'Mahasiswa',
  DOSEN: 'Dosen',
  EKSTERNAL: 'Eksternal',
}

function formatCurrencyPlain(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDatePlain(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTimePlain(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ExportPDFButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      // Fetch data from API
      const res = await fetch('/api/admin/export-bookings')
      if (!res.ok) throw new Error('Failed to fetch booking data')
      const data: ExportResponse = await res.json()

      // Dynamically import jsPDF (client-side only)
      const { default: jsPDF } = await import('jspdf')
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15

      // ===== HEADER SECTION =====
      // Green header bar
      doc.setFillColor(21, 128, 61) // green-700
      doc.rect(0, 0, pageWidth, 32, 'F')

      // Title text
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('LAPORAN BOOKING FASILITAS KAMPUS', margin, 14)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Universitas Islam Riau — Sistem Booking Fasilitas Kampus', margin, 22)

      // Date on the right
      const today = new Date()
      const dateStr = today.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      doc.setFontSize(9)
      doc.text(`Dicetak: ${dateStr}`, pageWidth - margin, 14, { align: 'right' })
      doc.text(
        `Pukul: ${today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`,
        pageWidth - margin,
        22,
        { align: 'right' }
      )

      // ===== STATISTICS SECTION =====
      let yPos = 42

      doc.setTextColor(30, 30, 30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Ringkasan Statistik', margin, yPos)
      yPos += 8

      // Stats boxes
      const statsBoxWidth = (pageWidth - margin * 2 - 10 * 5) / 6
      const statsData = [
        { label: 'Total Booking', value: data.stats.totalBookings.toString(), color: [219, 234, 254] },
        { label: 'Menunggu', value: data.stats.pendingBookings.toString(), color: [254, 243, 199] },
        { label: 'Disetujui', value: data.stats.approvedBookings.toString(), color: [220, 252, 231] },
        { label: 'Ditolak', value: data.stats.rejectedBookings.toString(), color: [254, 226, 226] },
        { label: 'Selesai', value: data.stats.completedBookings.toString(), color: [243, 244, 246] },
        { label: 'Pendapatan', value: formatCurrencyPlain(data.stats.totalRevenue), color: [220, 252, 231] },
      ]

      statsData.forEach((stat, i) => {
        const xPos = margin + i * (statsBoxWidth + 10)
        doc.setFillColor(stat.color[0], stat.color[1], stat.color[2])
        doc.roundedRect(xPos, yPos, statsBoxWidth, 20, 2, 2, 'F')

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(30, 30, 30)
        const valueSize = stat.label === 'Pendapatan' ? 9 : 14
        doc.setFontSize(valueSize)
        doc.text(stat.value, xPos + statsBoxWidth / 2, yPos + 10, { align: 'center' })

        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        doc.text(stat.label, xPos + statsBoxWidth / 2, yPos + 16, { align: 'center' })
      })

      yPos += 30

      // ===== TABLE SECTION =====
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Detail Booking', margin, yPos)
      yPos += 4

      const tableHeaders = [
        ['No', 'Kegiatan', 'Pemohon', 'Role', 'Fasilitas', 'Tanggal', 'Waktu', 'Harga', 'Status'],
      ]

      const tableBody = data.bookings.map((booking, index) => [
        (index + 1).toString(),
        booking.title.length > 25 ? booking.title.substring(0, 25) + '...' : booking.title,
        booking.userName,
        ROLE_LABELS[booking.userRole] || booking.userRole,
        booking.facilityName,
        formatDatePlain(booking.startTime),
        `${formatTimePlain(booking.startTime)} - ${formatTimePlain(booking.endTime)}`,
        booking.isFree ? 'Gratis' : formatCurrencyPlain(booking.totalPrice),
        booking.isFree && ['APPROVED', 'PAID'].includes(booking.status)
          ? 'Disetujui'
          : STATUS_LABELS[booking.status] || booking.status,
      ])

      autoTable(doc, {
        head: tableHeaders,
        body: tableBody,
        startY: yPos,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 7.5,
          cellPadding: 3,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [21, 128, 61],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 45 },
          2: { cellWidth: 35 },
          3: { cellWidth: 22, halign: 'center' },
          4: { cellWidth: 35 },
          5: { cellWidth: 35 },
          6: { cellWidth: 30, halign: 'center' },
          7: { cellWidth: 28, halign: 'right' },
          8: { cellWidth: 28, halign: 'center' },
        },
        didParseCell: (hookData: any) => {
          // Color-code status column
          if (hookData.section === 'body' && hookData.column.index === 8) {
            const val = hookData.cell.raw as string
            if (val === 'Menunggu Persetujuan') {
              hookData.cell.styles.textColor = [180, 130, 0]
              hookData.cell.styles.fontStyle = 'bold'
            } else if (val === 'Disetujui' || val === 'Sudah Dibayar') {
              hookData.cell.styles.textColor = [21, 128, 61]
              hookData.cell.styles.fontStyle = 'bold'
            } else if (val === 'Ditolak' || val === 'Dibatalkan') {
              hookData.cell.styles.textColor = [185, 28, 28]
              hookData.cell.styles.fontStyle = 'bold'
            }
          }
          // Color-code price column for free
          if (hookData.section === 'body' && hookData.column.index === 7) {
            if (hookData.cell.raw === 'Gratis') {
              hookData.cell.styles.textColor = [21, 128, 61]
              hookData.cell.styles.fontStyle = 'bold'
            }
          }
        },
      })

      // ===== FOOTER on every page =====
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFillColor(245, 245, 245)
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')
        doc.setFontSize(7)
        doc.setTextColor(130, 130, 130)
        doc.setFont('helvetica', 'normal')
        doc.text(
          'Dokumen ini digenerate secara otomatis oleh Sistem Booking Fasilitas Kampus — Universitas Islam Riau',
          margin,
          pageHeight - 5
        )
        doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 5, {
          align: 'right',
        })
      }

      // Save
      const fileName = `Laporan_Booking_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Gagal mengekspor laporan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={styles.exportBtn}
    >
      {loading ? (
        <Loader2 size={16} className={styles.exportBtnSpinner} />
      ) : (
        <FileDown size={16} />
      )}
      {loading ? 'Mengekspor...' : 'Export Laporan PDF'}
    </button>
  )
}
