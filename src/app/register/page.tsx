'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerUser } from '@/actions/auth'
import styles from '../login/auth.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState('MAHASISWA')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.set('role', role)
    const result = await registerUser(formData)

    if (result.error) {
      setError(result.error)
    } else if (result.success) {
      setSuccess(result.success)
      setTimeout(() => router.push('/login'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authBackground}>
        <div className={styles.authBgOrb1}></div>
        <div className={styles.authBgOrb2}></div>
        <div className={styles.authBgGrid}></div>
      </div>

      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <Link href="/" className={styles.authLogo}>
              <div className={styles.authLogoIcon}>
                <img src="/logo-uir.png" alt="Logo UIR" width={32} height={32} style={{ objectFit: 'contain' }} />
              </div>
              <span>BookingKampus</span>
            </Link>
            <h1 className={styles.authTitle}>Buat Akun Baru</h1>
            <p className={styles.authSubtitle}>Daftar untuk mulai booking fasilitas kampus</p>
          </div>

          {error && (
            <div className={styles.authError}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className={styles.authSuccess}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.authForm}>
            {/* Role Selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Daftar Sebagai</label>
              <div className={styles.roleSelector}>
                {[
                  { value: 'MAHASISWA', label: '🎓 Mahasiswa', desc: 'Booking gratis' },
                  { value: 'DOSEN', label: '👨‍🏫 Dosen', desc: 'Booking gratis' },
                  { value: 'EKSTERNAL', label: '🏢 Eksternal', desc: 'Berbayar' },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`${styles.roleOption} ${role === r.value ? styles.roleOptionActive : ''}`}
                  >
                    <span className={styles.roleLabel}>{r.label}</span>
                    <span className={styles.roleDesc}>{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.formLabel}>Nama Lengkap</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Masukkan nama lengkap"
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder={role === 'MAHASISWA' ? 'nama@student.uir.ac.id' : role === 'DOSEN' ? 'nama@uir.ac.id' : 'nama@gmail.com'}
                required
                className={styles.formInput}
              />
            </div>

            {role === 'MAHASISWA' && (
              <div className={styles.formGroup}>
                <label htmlFor="npm" className={styles.formLabel}>NPM</label>
                <input
                  id="npm"
                  name="npm"
                  type="text"
                  placeholder="Nomor Pokok Mahasiswa"
                  required
                  className={styles.formInput}
                />
              </div>
            )}

            {role === 'DOSEN' && (
              <div className={styles.formGroup}>
                <label htmlFor="nip" className={styles.formLabel}>NIP</label>
                <input
                  id="nip"
                  name="nip"
                  type="text"
                  placeholder="Nomor Induk Pegawai"
                  required
                  className={styles.formInput}
                />
              </div>
            )}

            {role === 'EKSTERNAL' && (
              <div className={styles.formGroup}>
                <label htmlFor="organization" className={styles.formLabel}>Organisasi / Perusahaan</label>
                <input
                  id="organization"
                  name="organization"
                  type="text"
                  placeholder="Nama organisasi atau perusahaan"
                  required
                  className={styles.formInput}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="phone" className={styles.formLabel}>No. Telepon</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                className={styles.formInput}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 6 karakter"
                  required
                  minLength={6}
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.formLabel}>Konfirmasi Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  required
                  minLength={6}
                  className={styles.formInput}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${styles.authSubmitBtn} ${loading ? styles.authSubmitBtnLoading : ''}`}
            >
              {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
            </button>
          </form>

          <div className={styles.authFooter}>
            <p>
              Sudah punya akun?{' '}
              <Link href="/login" className={styles.authLink}>
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
