'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, X, Calendar, Clock, MapPin, CheckCircle, Info } from 'lucide-react'
import styles from './dashboard.module.css'

interface QRButtonProps {
  code: string
  facilityName: string
  title: string
  startTime: string
  endTime: string
}

export default function QRButton({ code, facilityName, title, startTime, endTime }: QRButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const qrUrl = typeof window !== 'undefined' ? `${window.location.origin}/admin/verify-qr?code=${code}` : ''

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

  return (
    <>
      <button 
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(true)
        }} 
        className={styles.qrBtn}
        title="Klik untuk melihat QR Code tiket masuk"
      >
        <QrCode size={12} />
        <span>QR Tiket</span>
      </button>

      {isOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
          <div 
            className={styles.qrModal} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleContainer}>
                <QrCode size={20} className={styles.modalTitleIcon} />
                <h3 className={styles.modalTitle}>QR Code Tiket Masuk</h3>
              </div>
              <button 
                className={styles.modalCloseBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p className={styles.modalDesc}>
                Tunjukkan QR Code ini kepada petugas atau admin fasilitas di lokasi untuk melakukan verifikasi check-in.
              </p>

              <div className={styles.qrWrapper}>
                {qrUrl ? (
                  <QRCodeSVG 
                    value={qrUrl} 
                    size={220} 
                    level="H" 
                    includeMargin={true}
                    className={styles.qrCodeImage}
                  />
                ) : (
                  <div className={styles.qrPlaceholder}>Generating QR Code...</div>
                )}
                <div className={styles.qrCodeText}>{code}</div>
                <div className={styles.badgeValid}>
                  <CheckCircle size={14} />
                  <span>TIKET AKTIF / VALID</span>
                </div>
              </div>

              <div className={styles.bookingDetailBox}>
                <h4 className={styles.detailBoxTitle}>{title}</h4>
                
                <div className={styles.detailRow}>
                  <MapPin size={16} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Fasilitas</div>
                    <div className={styles.detailValue}>{facilityName}</div>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <Calendar size={16} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Tanggal</div>
                    <div className={styles.detailValue}>{formatDate(startTime)}</div>
                  </div>
                </div>

                <div className={styles.detailRow}>
                  <Clock size={16} className={styles.detailIcon} />
                  <div>
                    <div className={styles.detailLabel}>Waktu</div>
                    <div className={styles.detailValue}>
                      {formatTime(startTime)} - {formatTime(endTime)} WIB
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.warningAlert}>
                <Info size={14} className={styles.alertIcon} />
                <span>
                  Pastikan Anda datang tepat waktu sesuai jadwal. Penyalahgunaan tiket dapat membatalkan booking.
                </span>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.modalCloseMainBtn}
                onClick={() => setIsOpen(false)}
              >
                Tutup Tiket
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
