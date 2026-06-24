'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getQRDetails, verifyQRCode } from '@/actions/admin'
import { 
  CheckCircle, AlertTriangle, XCircle, ArrowLeft, 
  MapPin, Calendar, Clock, User, Landmark, ShieldCheck 
} from 'lucide-react'
import styles from './verify-qr.module.css'

interface BookingUser {
  name: string
  role: string
  nim: string | null
  phone: string | null
  organization: string | null
}

interface BookingFacility {
  name: string
}

interface BookingDetails {
  id: string
  title: string
  startTime: string
  endTime: string
  user: BookingUser
  facility: BookingFacility
}

interface QRDetailsData {
  success: boolean
  qr: {
    id: string
    code: string
    scannedAt: string | null
    scannedByName: string | null
    isValid: boolean
    createdAt: string
  }
  booking: BookingDetails
}

function VerifyQRContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')

  const [loading, setLoading] = useState(!!code)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(
    code ? null : 'Parameter code tidak ditemukan di URL. Silakan scan QR Code kembali.'
  )
  const [data, setData] = useState<QRDetailsData | null>(null)
  const [successResult, setSuccessResult] = useState<BookingDetails | null>(null)

  useEffect(() => {
    if (!code) return

    async function loadQRDetails() {
      try {
        setLoading(true)
        const res = await getQRDetails(code!)
        if (res.error) {
          setError(res.error)
        } else if (res.success && res.qr && res.booking) {
          setData(res as QRDetailsData)
        } else {
          setError('Gagal memuat detail QR Code.')
        }
      } catch {
        setError('Gagal memuat detail QR Code.')
      } finally {
        setLoading(false)
      }
    }

    loadQRDetails()
  }, [code])

  async function handleConfirmCheckIn() {
    if (!code) return
    try {
      setVerifying(true)
      const res = await verifyQRCode(code)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccessResult(res.booking as unknown as BookingDetails)
        // Refresh details
        setData((prev) => prev ? {
          ...prev,
          qr: {
            ...prev.qr,
            scannedAt: new Date().toISOString()
          }
        } : null)
      }
    } catch {
      setError('Terjadi kesalahan saat memproses verifikasi.')
    } finally {
      setVerifying(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    } catch {
      return dateStr
    }
  }

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Memuat detail tiket masuk...</p>
        </div>
      </div>
    )
  }

  // Success view (immediately after successful check-in)
  if (successResult) {
    return (
      <div className={styles.card}>
        <div className={styles.statusIconContainer}>
          <div className={`${styles.iconCircle} ${styles.successIcon}`}>
            <CheckCircle size={40} />
          </div>
        </div>
        <h2 className={`${styles.statusTitle} ${styles.successText}`}>Check-In Berhasil!</h2>
        <p className={styles.statusDesc}>
          Tiket QR Code telah berhasil diverifikasi. Booking telah diaktifkan untuk fasilitas di bawah ini.
        </p>

        <div className={styles.infoBox}>
          <h3 className={styles.infoTitle}>Detail Penggunaan Fasilitas</h3>
          
          <div className={styles.detailRow}>
            <MapPin size={18} className={styles.detailIcon} />
            <div>
              <div className={styles.detailLabel}>Fasilitas</div>
              <div className={styles.detailValue}>{successResult.facility.name}</div>
            </div>
          </div>

          <div className={styles.detailRow}>
            <Landmark size={18} className={styles.detailIcon} />
            <div>
              <div className={styles.detailLabel}>Kegiatan</div>
              <div className={styles.detailValue}>{successResult.title}</div>
            </div>
          </div>

          <div className={styles.detailRow}>
            <Calendar size={18} className={styles.detailIcon} />
            <div>
              <div className={styles.detailLabel}>Tanggal</div>
              <div className={styles.detailValue}>{formatDate(successResult.startTime)}</div>
            </div>
          </div>

          <div className={styles.detailRow}>
            <Clock size={18} className={styles.detailIcon} />
            <div>
              <div className={styles.detailLabel}>Waktu</div>
              <div className={styles.detailValue}>
                {formatTime(successResult.startTime)} - {formatTime(successResult.endTime)} WIB
              </div>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <Link href="/admin/bookings" className={styles.btnSecondary}>
            Kembali ke Daftar Booking
          </Link>
        </div>
      </div>
    )
  }

  // Error/Failure view
  if (error) {
    return (
      <div className={styles.card}>
        <div className={styles.statusIconContainer}>
          <div className={`${styles.iconCircle} ${styles.errorIcon}`}>
            <XCircle size={40} />
          </div>
        </div>
        <h2 className={`${styles.statusTitle} ${styles.errorText}`}>Verifikasi Gagal</h2>
        <p className={styles.statusDesc}>{error}</p>

        <div className={styles.buttonGroup}>
          <Link href="/admin/bookings" className={styles.btnSecondary}>
            Kembali ke Daftar Booking
          </Link>
        </div>
      </div>
    )
  }

  // Already Scanned view
  if (data?.qr?.scannedAt) {
    return (
      <div className={styles.card}>
        <div className={styles.statusIconContainer}>
          <div className={`${styles.iconCircle} ${styles.warningIcon}`}>
            <AlertTriangle size={40} />
          </div>
        </div>
        <h2 className={`${styles.statusTitle} ${styles.warningText}`}>Sudah Check-In</h2>
        <p className={styles.statusDesc}>
          QR Code ini sudah pernah dipindai dan digunakan untuk check-in sebelumnya.
        </p>

        <div className={styles.infoBox}>
          <h3 className={styles.infoTitle}>Informasi Check-In</h3>
          
          <div className={styles.detailRow}>
            <Clock size={18} className={styles.detailIcon} />
            <div>
              <div className={styles.detailLabel}>Waktu Scan</div>
              <div className={styles.detailValue}>{formatDate(data.qr.scannedAt)} pkl {formatTime(data.qr.scannedAt)} WIB</div>
            </div>
          </div>

          <div className={styles.detailRow}>
            <User size={18} className={styles.detailIcon} />
            <div>
              <div className={styles.detailLabel}>Diverifikasi Oleh</div>
              <div className={styles.detailValue}>{data.qr.scannedByName || 'Administrator'}</div>
            </div>
          </div>

          <div className={styles.detailRow}>
            <MapPin size={18} className={styles.detailIcon} />
            <div>
              <div className={styles.detailLabel}>Fasilitas</div>
              <div className={styles.detailValue}>{data.booking.facility.name}</div>
            </div>
          </div>

          <div className={styles.detailRow}>
            <Landmark size={18} className={styles.detailIcon} />
            <div>
              <div className={styles.detailLabel}>Kegiatan</div>
              <div className={styles.detailValue}>{data.booking.title}</div>
            </div>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <Link href="/admin/bookings" className={styles.btnSecondary}>
            Kembali ke Daftar Booking
          </Link>
        </div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className={styles.card}>
        <div className={styles.statusIconContainer}>
          <div className={`${styles.iconCircle} ${styles.errorIcon}`}>
            <XCircle size={40} />
          </div>
        </div>
        <h2 className={`${styles.statusTitle} ${styles.errorText}`}>Data Tidak Ditemukan</h2>
        <p className={styles.statusDesc}>Detail QR Code tidak dapat ditemukan atau dimuat.</p>
        <div className={styles.buttonGroup}>
          <Link href="/admin/bookings" className={styles.btnSecondary}>
            Kembali ke Daftar Booking
          </Link>
        </div>
      </div>
    )
  }

  // Normal review & confirmation view
  const { booking } = data
  return (
    <div className={styles.card}>
      <h2 className={styles.statusTitle}>Konfirmasi Check-In</h2>
      <p className={styles.statusDesc}>
        Periksa informasi di bawah ini sebelum mengonfirmasi masuk untuk pengguna fasilitas.
      </p>

      <div className={styles.infoBox}>
        <h3 className={styles.infoTitle}>Detail Booking & Kegiatan</h3>
        
        <div className={styles.detailRow}>
          <Landmark size={18} className={styles.detailIcon} />
          <div>
            <div className={styles.detailLabel}>Nama Kegiatan</div>
            <div className={styles.detailValue}>{booking.title}</div>
          </div>
        </div>

        <div className={styles.detailRow}>
          <MapPin size={18} className={styles.detailIcon} />
          <div>
            <div className={styles.detailLabel}>Fasilitas</div>
            <div className={styles.detailValue}>{booking.facility.name}</div>
          </div>
        </div>

        <div className={styles.detailRow}>
          <Calendar size={18} className={styles.detailIcon} />
          <div>
            <div className={styles.detailLabel}>Hari & Tanggal</div>
            <div className={styles.detailValue}>{formatDate(booking.startTime)}</div>
          </div>
        </div>

        <div className={styles.detailRow}>
          <Clock size={18} className={styles.detailIcon} />
          <div>
            <div className={styles.detailLabel}>Jadwal Penggunaan</div>
            <div className={styles.detailValue}>
              {formatTime(booking.startTime)} - {formatTime(booking.endTime)} WIB
            </div>
          </div>
        </div>
      </div>

      <div className={styles.infoBox}>
        <h3 className={styles.infoTitle}>Detail Pemesan</h3>

        <div className={styles.detailRow}>
          <User size={18} className={styles.detailIcon} />
          <div>
            <div className={styles.detailLabel}>Nama Lengkap</div>
            <div className={styles.detailValue}>{booking.user.name} ({booking.user.role})</div>
          </div>
        </div>

        {booking.user.nim && (
          <div className={styles.detailRow}>
            <div className={styles.detailIcon} style={{ width: 18 }}></div>
            <div>
              <div className={styles.detailLabel}>NIM / NIP</div>
              <div className={styles.detailValue}>{booking.user.nim}</div>
            </div>
          </div>
        )}

        {booking.user.organization && (
          <div className={styles.detailRow}>
            <div className={styles.detailIcon} style={{ width: 18 }}></div>
            <div>
              <div className={styles.detailLabel}>Organisasi / Pihak</div>
              <div className={styles.detailValue}>{booking.user.organization}</div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.buttonGroup}>
        <button 
          onClick={handleConfirmCheckIn}
          disabled={verifying}
          className={styles.btnPrimary}
        >
          {verifying ? (
            'Memproses Verifikasi...'
          ) : (
            <>
              <ShieldCheck size={20} />
              <span>Konfirmasi Check-In & Gunakan</span>
            </>
          )}
        </button>
        <Link href="/admin/bookings" className={styles.btnSecondary}>
          Batal
        </Link>
      </div>
    </div>
  )
}

export default function AdminVerifyQRPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/bookings" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Kembali ke Panel Admin</span>
        </Link>
        <h1 className={styles.title}>Verifikasi QR Code</h1>
      </div>

      <Suspense fallback={
        <div className={styles.card}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Memuat sistem verifikasi...</p>
          </div>
        </div>
      }>
        <VerifyQRContent />
      </Suspense>
    </div>
  )
}
