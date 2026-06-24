'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useRef } from 'react'
import { 
  Plus, Edit, Trash2, X, Upload, MapPin, Users, AlertCircle 
} from 'lucide-react'
import { createFacility, updateFacility, deleteFacility, toggleFacilityStatus } from '@/actions/admin'
import { formatCurrency } from '@/lib/utils'
import styles from './facilities.module.css'

interface Facility {
  id: string
  name: string
  slug: string
  type: string
  description: string
  capacity: number
  location: string
  images: string[]
  pricePerHour: number
  isActive: boolean
  amenities: string[]
  rules: string
  openTime: string
  closeTime: string
}

interface FacilitiesTableProps {
  initialFacilities: Facility[]
}

export function FacilitiesTable({ initialFacilities }: FacilitiesTableProps) {
  const [facilitiesList, setFacilitiesList] = useState<Facility[]>(initialFacilities)
  const [showModal, setShowModal] = useState<'add' | 'edit' | null>(null)
  const [activeFacility, setActiveFacility] = useState<Facility | null>(null)

  // Form States
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [type, setType] = useState('AULA')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState(10)
  const [location, setLocation] = useState('')
  const [pricePerHour, setPricePerHour] = useState(0)
  const [openTime, setOpenTime] = useState('08:00')
  const [closeTime, setCloseTime] = useState('22:00')
  const [rules, setRules] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [amenitiesList, setAmenitiesList] = useState<string[]>([])
  const [currentAmenity, setCurrentAmenity] = useState('')

  // UI States
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate slug dynamically from name
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric chars
      .replace(/\s+/g, '-') // replace spaces with single dash
      .replace(/-+/g, '-') // collapse consecutive dashes
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setName(val)
    if (showModal === 'add') {
      setSlug(generateSlug(val))
    }
  }

  // Open modal with default states
  const openAddModal = () => {
    setName('')
    setSlug('')
    setType('AULA')
    setDescription('')
    setCapacity(50)
    setLocation('')
    setPricePerHour(0)
    setOpenTime('08:00')
    setCloseTime('22:00')
    setRules('')
    setImageUrls([])
    setAmenitiesList([])
    setCurrentAmenity('')
    setErrorMsg('')
    setShowModal('add')
  }

  const openEditModal = (facility: Facility) => {
    setActiveFacility(facility)
    setName(facility.name)
    setSlug(facility.slug)
    setType(facility.type)
    setDescription(facility.description || '')
    setCapacity(facility.capacity)
    setLocation(facility.location)
    setPricePerHour(facility.pricePerHour)
    setOpenTime(facility.openTime || '08:00')
    setCloseTime(facility.closeTime || '22:00')
    setRules(facility.rules || '')
    setImageUrls(facility.images || [])
    setAmenitiesList(facility.amenities || [])
    setCurrentAmenity('')
    setErrorMsg('')
    setShowModal('edit')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setErrorMsg('')

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('documentType', 'OTHER')

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Gagal mengupload gambar')
        }

        setImageUrls((prev) => [...prev, data.fileUrl])
      }
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunggah gambar.'
      setErrorMsg(message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleAddAmenity = () => {
    const val = currentAmenity.trim()
    if (!val) return
    if (amenitiesList.includes(val)) {
      setCurrentAmenity('')
      return
    }
    setAmenitiesList((prev) => [...prev, val])
    setCurrentAmenity('')
  }

  const handleRemoveAmenity = (indexToRemove: number) => {
    setAmenitiesList((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !slug || !location) {
      setErrorMsg('Harap lengkapi semua kolom wajib (Nama, Slug, Lokasi).')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    const formData = new FormData()
    formData.append('name', name)
    formData.append('slug', slug)
    formData.append('type', type)
    formData.append('description', description)
    formData.append('capacity', capacity.toString())
    formData.append('location', location)
    formData.append('pricePerHour', pricePerHour.toString())
    formData.append('openTime', openTime)
    formData.append('closeTime', closeTime)
    formData.append('rules', rules)
    formData.append('images', JSON.stringify(imageUrls))
    formData.append('amenities', JSON.stringify(amenitiesList))

    try {
      let res
      if (showModal === 'add') {
        res = await createFacility(formData)
      } else if (showModal === 'edit' && activeFacility) {
        res = await updateFacility(activeFacility.id, formData)
      }

      if (res && res.error) {
        setErrorMsg(res.error)
      } else {
        // Refresh local UI
        window.location.reload()
      }
    } catch (err) {
      console.error(err)
      setErrorMsg('Terjadi kesalahan koneksi sistem.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    
    // Optimistic UI update
    setFacilitiesList((prev) =>
      prev.map((f) => (f.id === id ? { ...f, isActive: nextStatus } : f))
    )

    try {
      const res = await toggleFacilityStatus(id, nextStatus)
      if (res && res.error) {
        // Revert on error
        setFacilitiesList((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isActive: currentStatus } : f))
        )
        alert(res.error)
      }
    } catch (err) {
      console.error(err)
      setFacilitiesList((prev) =>
        prev.map((f) => (f.id === id ? { ...f, isActive: currentStatus } : f))
      )
      alert('Terjadi kesalahan koneksi saat merubah keaktifan fasilitas.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus fasilitas "${name}" secara permanen? Data yang sudah terhapus tidak dapat dikembalikan.`)) {
      return
    }

    try {
      const res = await deleteFacility(id)
      if (res && res.error) {
        alert(res.error)
      } else {
        setFacilitiesList((prev) => prev.filter((f) => f.id !== id))
      }
    } catch (err) {
      console.error(err)
      alert('Gagal menghapus fasilitas karena kesalahan sistem.')
    }
  }

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Manajemen Fasilitas</h1>
          <p>Tambahkan, edit, aktifkan/nonaktifkan, atau hapus fasilitas pemesanan kampus</p>
        </div>
        <button onClick={openAddModal} className={styles.addBtn}>
          <Plus size={16} /> Tambah Fasilitas
        </button>
      </div>

      {facilitiesList.length === 0 ? (
        <div className={styles.emptyCard}>
          <div className={styles.emptyCardIcon}>🏢</div>
          <h3>Belum ada fasilitas</h3>
          <p>Mulai dengan menambahkan fasilitas baru dengan tombol di atas.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Fasilitas</th>
                  <th>Kategori</th>
                  <th>Kapasitas</th>
                  <th>Harga per Jam</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {facilitiesList.map((facility) => (
                  <tr key={facility.id}>
                    <td>
                      <div className={styles.facilityCell}>
                        <div className={styles.facilityImgWrapper}>
                          {facility.images && facility.images.length > 0 ? (
                            <img src={facility.images[0]} alt={facility.name} className={styles.facilityImg} />
                          ) : (
                            <div className={styles.facilityNoImg}>
                              <span>No Img</span>
                            </div>
                          )}
                        </div>
                        <div className={styles.facilityInfo}>
                          <span className={styles.facilityName}>{facility.name}</span>
                          <span className={styles.facilityLoc}>
                            <MapPin size={12} /> {facility.location}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.typeBadge} ${styles['badge' + facility.type] || ''}`}>
                        {facility.type}
                      </span>
                    </td>
                    <td>
                      <span className={styles.capacityBadge}>
                        <Users size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                        {facility.capacity} Orang
                      </span>
                    </td>
                    <td>
                      <span className={styles.priceBadge}>
                        {facility.pricePerHour === 0 ? 'Gratis' : formatCurrency(facility.pricePerHour)}
                      </span>
                    </td>
                    <td>
                      <div className={styles.switchContainer}>
                        <label className={styles.switch}>
                          <input 
                            type="checkbox" 
                            checked={facility.isActive} 
                            onChange={() => handleToggleStatus(facility.id, facility.isActive)}
                          />
                          <span className={styles.slider}></span>
                        </label>
                        <span className={styles.statusLabel}>
                          {facility.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => openEditModal(facility)} className={styles.editBtn}>
                          <Edit size={12} /> Ubah
                        </button>
                        <button onClick={() => handleDelete(facility.id, facility.name)} className={styles.deleteBtn}>
                          <Trash2 size={12} /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal !== null && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>{showModal === 'add' ? 'Tambah Fasilitas Baru' : 'Ubah Fasilitas'}</h2>
              <button onClick={() => setShowModal(null)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {errorMsg && (
                  <div style={{ display: 'flex', gap: '8px', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.813rem', alignItems: 'center' }}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Nama Fasilitas *</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={name} 
                      onChange={handleNameChange}
                      placeholder="Contoh: Gedung Aula Utama"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Slug URL *</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={slug} 
                      onChange={(e) => setSlug(generateSlug(e.target.value))}
                      placeholder="contoh-gedung-aula-utama"
                      required
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Kategori *</label>
                    <select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="AULA">AULA</option>
                      <option value="GOR">GOR</option>
                      <option value="GEDUNG">GEDUNG</option>
                      <option value="LAPANGAN">LAPANGAN</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Lokasi / Gedung *</label>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Contoh: Sayap Kiri Rektorat Lt. 2"
                      required
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Kapasitas Maksimal (Orang) *</label>
                    <input 
                      type="number" 
                      className={styles.input} 
                      value={capacity} 
                      onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                      min="1"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Harga per Jam (Rp) *</label>
                    <input 
                      type="number" 
                      className={styles.input} 
                      value={pricePerHour} 
                      onChange={(e) => setPricePerHour(parseFloat(e.target.value) || 0)}
                      min="0"
                      placeholder="0 = gratis untuk civitas akademika"
                      required
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.formGroup}>
                    <label>Jam Operasional Buka</label>
                    <input 
                      type="time" 
                      className={styles.input} 
                      value={openTime} 
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Jam Operasional Tutup</label>
                    <input 
                      type="time" 
                      className={styles.input} 
                      value={closeTime} 
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Deskripsi Fasilitas</label>
                  <textarea 
                    className={styles.textarea} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masukkan deskripsi lengkap mengenai fasilitas ini..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Peraturan Penggunaan</label>
                  <textarea 
                    className={styles.textarea} 
                    value={rules} 
                    onChange={(e) => setRules(e.target.value)}
                    placeholder="Contoh: Tidak boleh membawa makanan berat, wajib menjaga ketertiban..."
                  />
                </div>

                {/* Amenities Section */}
                <div className={styles.formGroup}>
                  <label>Fasilitas Penunjang (Amenities)</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input 
                      type="text" 
                      className={styles.input} 
                      value={currentAmenity} 
                      onChange={(e) => setCurrentAmenity(e.target.value)}
                      placeholder="Contoh: AC, Sound System, Proyektor"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddAmenity()
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddAmenity} 
                      className={styles.submitActionBtn}
                      style={{ padding: '0.625rem 1rem' }}
                    >
                      Tambah
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {amenitiesList.map((amenity, idx) => (
                      <span 
                        key={idx} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--neutral-100)', color: 'var(--text-secondary)', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600 }}
                      >
                        {amenity}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveAmenity(idx)}
                          style={{ border: 'none', background: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: 0 }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                    {amenitiesList.length === 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        Belum ada fasilitas penunjang ditambahkan.
                      </span>
                    )}
                  </div>
                </div>

                {/* Images Upload Section */}
                <div className={styles.formGroup}>
                  <label>Foto / Gambar Fasilitas</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()} 
                    className={styles.dropzone}
                  >
                    <Upload size={24} className={styles.dropzoneIcon} />
                    <span className={styles.dropzoneText}>
                      {uploading ? 'Sedang mengunggah...' : 'Klik untuk mengunggah gambar'}
                    </span>
                    <span className={styles.dropzoneHint}>Format: JPG, PNG, WebP (Maks. 5MB)</span>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className={styles.fileInput}
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={uploading}
                    />
                  </div>

                  {uploading && (
                    <div className={styles.uploadProgress}>
                      <div className={styles.uploadProgressBar} style={{ width: '60%' }}></div>
                    </div>
                  )}

                  {imageUrls.length > 0 && (
                    <div className={styles.previewContainer}>
                      <span className={styles.previewLabel}>Gambar Terunggah ({imageUrls.length}):</span>
                      <div className={styles.imageGrid}>
                        {imageUrls.map((url, idx) => (
                          <div key={idx} className={styles.previewItem}>
                            <img src={url} alt={`Preview ${idx + 1}`} />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveImage(idx)} 
                              className={styles.removeImgBtn}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(null)} 
                  className={styles.cancelActionBtn}
                  disabled={isSubmitting || uploading}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className={styles.submitActionBtn}
                  disabled={isSubmitting || uploading}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
