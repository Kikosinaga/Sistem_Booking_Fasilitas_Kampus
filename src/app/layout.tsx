import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Booking Fasilitas Kampus | Sistem Peminjaman Fasilitas',
  description:
    'Sistem booking fasilitas kampus online. Pesan aula, gedung, lapangan, dan fasilitas kampus lainnya dengan mudah dan cepat.',
  keywords: ['booking', 'fasilitas', 'kampus', 'peminjaman', 'aula', 'lapangan'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={poppins.variable}>
      <body>{children}</body>
    </html>
  )
}
