'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginUser } from '@/actions/auth'
import styles from './auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await loginUser(formData)

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result.success) {
      router.push(result.redirectTo || '/dashboard')
    }
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
            <h1 className={styles.authTitle}>Selamat Datang</h1>
            <p className={styles.authSubtitle}>Masuk ke akun Anda untuk mulai booking</p>
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

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="nama@kampus.ac.id"
                required
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password"
                required
                className={styles.formInput}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`${styles.authSubmitBtn} ${loading ? styles.authSubmitBtnLoading : ''}`}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className={styles.authFooter}>
            <p>
              Belum punya akun?{' '}
              <Link href="/register" className={styles.authLink}>
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
