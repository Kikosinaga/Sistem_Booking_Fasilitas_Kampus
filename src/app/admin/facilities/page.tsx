/* eslint-disable @next/next/no-img-element */
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from '../dashboard/admin.module.css'
import { prisma } from '@/lib/prisma'
import { 
  BarChart3, ClipboardList, Building2, Globe, LogOut 
} from 'lucide-react'
import { FacilitiesTable } from './FacilitiesTable'

export default async function AdminFacilitiesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const facilities = await prisma.facility.findMany({
    orderBy: { name: 'asc' },
  })

  // Safe formatting for JSON arrays and optional properties
  const formattedFacilities = facilities.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    type: f.type,
    description: f.description,
    capacity: f.capacity,
    location: f.location,
    images: Array.isArray(f.images) ? (f.images as string[]) : [],
    pricePerHour: f.pricePerHour,
    isActive: f.isActive,
    amenities: Array.isArray(f.amenities) ? (f.amenities as string[]) : [],
    rules: f.rules || '',
    openTime: f.openTime || '08:00',
    closeTime: f.closeTime || '22:00',
  }))

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <img src="/logo-uir.png" alt="Logo UIR" width={32} height={32} style={{ objectFit: 'contain' }} />
          </div>
          <div>
            <div className={styles.sidebarBrand}>BookingKampus</div>
            <div className={styles.sidebarRole}>Admin Panel</div>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarSection}>
            <span className={styles.sidebarSectionTitle}>Menu Utama</span>
            <Link href="/admin/dashboard" className={styles.sidebarLink} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} /> Dashboard
            </Link>
            <Link href="/admin/bookings" className={styles.sidebarLink} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} /> Booking
            </Link>
            <Link href="/admin/facilities" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={16} /> Fasilitas
            </Link>
          </div>
          <div className={styles.sidebarSection}>
            <span className={styles.sidebarSectionTitle}>Lainnya</span>
            <Link href="/" className={styles.sidebarLink} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={16} /> Lihat Website
            </Link>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
              <button type="submit" className={styles.sidebarLink} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                <LogOut size={16} /> Keluar
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Kelola Fasilitas</h1>
            <p className={styles.pageSubtitle}>{facilities.length} total fasilitas terdaftar</p>
          </div>
        </div>

        <div className={styles.pageContent}>
          <FacilitiesTable initialFacilities={formattedFacilities} />
        </div>
      </main>
    </div>
  )
}
