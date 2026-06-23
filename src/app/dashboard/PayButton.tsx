'use client'

import { useState } from 'react'
import Script from 'next/script'
import styles from './dashboard.module.css'
import { getOrCreateSnapToken } from '@/actions/booking'

interface PayButtonProps {
  bookingId: string
}

export default function PayButton({ bookingId }: PayButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handlePay(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    
    // Call server action to get or create the snap token
    const res = await getOrCreateSnapToken(bookingId)
    if (res.error) {
      alert(res.error)
      setLoading(false)
      return
    }

    const token = res.snapToken
    if (!token) {
      alert('Gagal mendapatkan token pembayaran dari Midtrans.')
      setLoading(false)
      return
    }

    const snap = (window as any).snap
    if (snap) {
      snap.pay(token, {
        onSuccess: function (result: any) {
          window.location.reload()
        },
        onPending: function (result: any) {
          window.location.reload()
        },
        onError: function (result: any) {
          alert('Pembayaran gagal. Silakan coba lagi.')
          setLoading(false)
        },
        onClose: function () {
          setLoading(false)
        }
      })
    } else {
      alert('Sistem pembayaran gagal dimuat. Silakan refresh halaman.')
      setLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="afterInteractive"
      />
      <button onClick={handlePay} disabled={loading} className={styles.payBtn}>
        {loading ? 'Memproses...' : '💳 Bayar Sekarang'}
      </button>
    </>
  )
}
