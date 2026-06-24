'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createBooking, checkBookingConflict } from '@/actions/booking'
import { formatCurrency } from '@/lib/utils'
import Script from 'next/script'
import styles from './detail.module.css'

interface BookingFormProps {
  facility: any
  userRole: string
}

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

export default function BookingForm({ facility, userRole }: BookingFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [conflict, setConflict] = useState<any[]>([])
  const [calculatedPrice, setCalculatedPrice] = useState(0)

  // Upload states
  const [ktmFile, setKtmFile] = useState<UploadedFile | null>(null)
  const [proposalFile, setProposalFile] = useState<UploadedFile | null>(null)
  const [paymentProofFile, setPaymentProofFile] = useState<UploadedFile | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [uploadingKtm, setUploadingKtm] = useState(false)
  const [uploadingProposal, setUploadingProposal] = useState(false)
  const [uploadingPayment, setUploadingPayment] = useState(false)

  const ktmInputRef = useRef<HTMLInputElement>(null)
  const proposalInputRef = useRef<HTMLInputElement>(null)
  const paymentInputRef = useRef<HTMLInputElement>(null)

  const isFree = userRole === 'MAHASISWA' || userRole === 'DOSEN'
  const isMahasiswa = userRole === 'MAHASISWA'
  const isEksternal = userRole === 'EKSTERNAL'

  function calculatePrice(startTime: string, endTime: string) {
    if (isFree || !startTime || !endTime) {
      setCalculatedPrice(0)
      return
    }
    const start = new Date(startTime)
    const end = new Date(endTime)
    const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60))
    if (hours > 0) {
      setCalculatedPrice(hours * facility.pricePerHour)
    }
  }

  async function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const form = e.currentTarget.form
    if (!form) return

    const startTime = (form.elements.namedItem('startTime') as HTMLInputElement)?.value
    const endTime = (form.elements.namedItem('endTime') as HTMLInputElement)?.value

    if (startTime && endTime) {
      calculatePrice(startTime, endTime)

      // Check conflicts
      const conflicts = await checkBookingConflict(
        facility.id,
        new Date(startTime),
        new Date(endTime)
      )
      setConflict(conflicts)
    }
  }

  async function uploadFile(
    file: File,
    documentType: string,
    allowedTypes: string[],
    friendlyLabel: string,
    setUploading: (v: boolean) => void,
    setUploaded: (v: UploadedFile | null) => void
  ) {
    // Client-side type validation
    if (!allowedTypes.includes(file.type)) {
      setError(`Format file tidak didukung. Gunakan ${friendlyLabel}.`)
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gagal mengupload file')
        setUploading(false)
        return
      }

      setUploaded({
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
      })
    } catch {
      setError('Gagal mengupload file. Coba lagi.')
    }
    setUploading(false)
  }

  function handleFileDrop(
    e: React.DragEvent,
    documentType: string,
    allowedTypes: string[],
    friendlyLabel: string,
    setUploading: (v: boolean) => void,
    setUploaded: (v: UploadedFile | null) => void
  ) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadFile(file, documentType, allowedTypes, friendlyLabel, setUploading, setUploaded)
    }
  }

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: string,
    allowedTypes: string[],
    friendlyLabel: string,
    setUploading: (v: boolean) => void,
    setUploaded: (v: UploadedFile | null) => void
  ) {
    const file = e.target.files?.[0]
    if (file) {
      uploadFile(file, documentType, allowedTypes, friendlyLabel, setUploading, setUploaded)
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function isImageType(mimeType: string) {
    return mimeType.startsWith('image/')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate uploads for mahasiswa
    if (isMahasiswa) {
      if (!ktmFile) {
        setError('Upload KTM wajib untuk mahasiswa')
        return
      }
      if (!proposalFile) {
        setError('Upload Proposal Kegiatan wajib untuk mahasiswa')
        return
      }
    }

    // Validate uploads for eksternal
    if (isEksternal) {
      if (!paymentMethod) {
        setError('Pilih metode pembayaran terlebih dahulu')
        return
      }
    }

    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('facilityId', facility.id)

    // Append uploaded file data
    if (ktmFile) {
      formData.set('ktmFileName', ktmFile.fileName)
      formData.set('ktmFileUrl', ktmFile.fileUrl)
      formData.set('ktmFileSize', String(ktmFile.fileSize))
      formData.set('ktmMimeType', ktmFile.mimeType)
    }
    if (proposalFile) {
      formData.set('proposalFileName', proposalFile.fileName)
      formData.set('proposalFileUrl', proposalFile.fileUrl)
      formData.set('proposalFileSize', String(proposalFile.fileSize))
      formData.set('proposalMimeType', proposalFile.mimeType)
    }
    if (paymentMethod) {
      formData.set('paymentMethod', paymentMethod)
    }

    const result = await createBooking(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.success) {
      setSuccess('Booking berhasil diajukan! Menunggu persetujuan admin.')
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  function renderUploadArea(
    label: string,
    description: string,
    icon: string,
    uploadedFile: UploadedFile | null,
    isUploading: boolean,
    inputRef: React.RefObject<HTMLInputElement | null>,
    documentType: string,
    setUploading: (v: boolean) => void,
    setUploaded: (v: UploadedFile | null) => void,
    acceptTypes: string[],
    acceptLabel: string,
    required: boolean = true
  ) {
    const acceptString = acceptTypes.join(',')

    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          {label} {required && <span className={styles.requiredStar}>*</span>}
        </label>
        <p className={styles.uploadHint}>{description}</p>

        {uploadedFile ? (
          <div className={styles.uploadedPreview}>
            <div className={styles.uploadedPreviewContent}>
              {isImageType(uploadedFile.mimeType) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={uploadedFile.fileUrl}
                  alt={uploadedFile.fileName}
                  className={styles.uploadedThumbnail}
                />
              ) : (
                <div className={styles.uploadedFileIcon}>📄</div>
              )}
              <div className={styles.uploadedInfo}>
                <span className={styles.uploadedName}>{uploadedFile.fileName}</span>
                <span className={styles.uploadedSize}>
                  {formatFileSize(uploadedFile.fileSize)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploaded(null)}
              className={styles.uploadedRemove}
              title="Hapus file"
            >
              ✕
            </button>
          </div>
        ) : (
          <div
            className={`${styles.uploadDropzone} ${isUploading ? styles.uploadDropzoneUploading : ''}`}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={(e) => handleFileDrop(e, documentType, acceptTypes, acceptLabel, setUploading, setUploaded)}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? (
              <div className={styles.uploadSpinner}>
                <div className={styles.spinner}></div>
                <span>Mengupload...</span>
              </div>
            ) : (
              <>
                <div className={styles.uploadIcon}>{icon}</div>
                <span className={styles.uploadText}>
                  Klik atau drag file ke sini
                </span>
                <span className={styles.uploadSubtext}>
                  {acceptLabel} (maks. 5MB)
                </span>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={acceptString}
              className={styles.uploadInput}
              onChange={(e) => handleFileSelect(e, documentType, acceptTypes, acceptLabel, setUploading, setUploaded)}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={styles.bookingForm}>
      {error && (
        <div className={styles.alertError}>⚠️ {error}</div>
      )}
      {success && (
        <div className={styles.alertSuccess}>✅ {success}</div>
      )}
      {conflict.length > 0 && (
        <div className={styles.alertConflict}>
          <strong>⚠️ Jadwal Bentrok!</strong>
          <p>Terdapat {conflict.length} booking pada waktu yang dipilih:</p>
          {conflict.map((c: any) => (
            <div key={c.id} className={styles.conflictItem}>
              {c.title} ({c.user?.name})
            </div>
          ))}
        </div>
      )}

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Nama Kegiatan *</label>
        <input
          name="title"
          type="text"
          required
          placeholder="Contoh: Seminar Nasional IT"
          className={styles.formInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Organisasi / Penyelenggara</label>
        <input
          name="organization"
          type="text"
          placeholder="Contoh: BEM Fakultas Teknik"
          className={styles.formInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Tanggal & Jam Mulai *</label>
        <input
          name="startTime"
          type="datetime-local"
          required
          onChange={handleTimeChange}
          className={styles.formInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Tanggal & Jam Selesai *</label>
        <input
          name="endTime"
          type="datetime-local"
          required
          onChange={handleTimeChange}
          className={styles.formInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Jumlah Peserta</label>
        <input
          name="attendees"
          type="number"
          min="1"
          max={facility.capacity}
          placeholder={`Maks. ${facility.capacity} orang`}
          className={styles.formInput}
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Deskripsi Kegiatan</label>
        <textarea
          name="description"
          rows={3}
          placeholder="Jelaskan kegiatan Anda..."
          className={styles.formTextarea}
        />
      </div>

      {/* === MAHASISWA: Upload KTM & Proposal === */}
      {isMahasiswa && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadSectionHeader}>
            <span className={styles.uploadSectionIcon}>📎</span>
            <div>
              <h3 className={styles.uploadSectionTitle}>Dokumen Persyaratan</h3>
              <p className={styles.uploadSectionSubtitle}>
                Mahasiswa wajib melampirkan KTM dan Proposal Kegiatan
              </p>
            </div>
          </div>

          {renderUploadArea(
            'Kartu Tanda Mahasiswa (KTM)',
            'Upload foto KTM yang masih berlaku',
            '🪪',
            ktmFile,
            uploadingKtm,
            ktmInputRef,
            'KTM',
            setUploadingKtm,
            setKtmFile,
            ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
            'JPG, PNG, atau PDF'
          )}

          {renderUploadArea(
            'Proposal Kegiatan',
            'Upload proposal/surat kegiatan dalam format PDF',
            '📋',
            proposalFile,
            uploadingProposal,
            proposalInputRef,
            'PROPOSAL',
            setUploadingProposal,
            setProposalFile,
            ['application/pdf'],
            'PDF'
          )}
        </div>
      )}

      {/* === EKSTERNAL: Metode Pembayaran === */}
      {isEksternal && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadSectionHeader}>
            <span className={styles.uploadSectionIcon}>💳</span>
            <div>
              <h3 className={styles.uploadSectionTitle}>Pembayaran</h3>
              <p className={styles.uploadSectionSubtitle}>
                Pilih metode pembayaran digital Anda
              </p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Metode Pembayaran <span className={styles.requiredStar}>*</span>
            </label>
            <div className={styles.paymentMethodGrid}>
              {[
                { value: 'BANK_TRANSFER', label: 'Transfer Bank', icon: '🏦', desc: 'Virtual Account (VA) Otomatis' },
                { value: 'QRIS', label: 'QRIS / E-Wallet', icon: '📱', desc: 'Scan QRIS (GoPay, OVO, Dana)' },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  className={`${styles.paymentMethodCard} ${paymentMethod === method.value ? styles.paymentMethodCardActive : ''}`}
                  onClick={() => setPaymentMethod(method.value)}
                >
                  <span className={styles.paymentMethodIcon}>{method.icon}</span>
                  <span className={styles.paymentMethodLabel}>{method.label}</span>
                  <span className={styles.paymentMethodDesc}>{method.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Price Summary */}
      <div className={styles.priceSummary}>
        <div className={styles.priceRow}>
          <span>Harga per jam</span>
          <span>{isFree ? 'Gratis' : formatCurrency(facility.pricePerHour)}</span>
        </div>
        {isEksternal && paymentMethod && (
          <div className={styles.priceRow}>
            <span>Metode Pembayaran</span>
            <span>
              {paymentMethod === 'BANK_TRANSFER' ? '🏦 Transfer Bank' : '📱 QRIS / E-Wallet'}
            </span>
          </div>
        )}
        <div className={styles.priceTotal}>
          <span>Total</span>
          <span>{isFree ? 'Gratis (Mahasiswa/Dosen)' : formatCurrency(calculatedPrice)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || conflict.length > 0 || uploadingKtm || uploadingProposal}
        className={styles.submitBtn}
      >
        {loading ? 'Memproses...' : conflict.length > 0 ? 'Jadwal Bentrok' : 'Ajukan Booking'}
      </button>

      <p className={styles.formNote}>
        * Booking akan diproses setelah pembayaran terkonfirmasi
      </p>

      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
    </form>
  )
}
