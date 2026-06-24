import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDashboardStats } from '@/actions/admin'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import styles from './admin.module.css'
import { formatCurrency, formatDate, formatTime, getBookingStatusLabel, getRoleLabel } from '@/lib/utils'
import { BarChart3, ClipboardList, Building2, Globe, LogOut, Hourglass, Coins, Users } from 'lucide-react'

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'ADMIN') redirect('/dashboard')

  const stats = await getDashboardStats()

  return (
    <div className={styles.adminLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>
            <img src="/logo uir.png" alt="Logo UIR" width={32} height={32} style={{ objectFit: 'contain' }} />
          </div>
          <div>
            <div className={styles.sidebarBrand}>BookingKampus</div>
            <div className={styles.sidebarRole}>Admin Panel</div>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          <div className={styles.sidebarSection}>
            <span className={styles.sidebarSectionTitle}>Menu Utama</span>
            <Link href="/admin/dashboard" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} /> Dashboard
            </Link>
            <Link href="/admin/bookings" className={styles.sidebarLink} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} /> Booking
              {stats && stats.pendingBookings > 0 && (
                <span className={styles.sidebarBadge}>{stats.pendingBookings}</span>
              )}
            </Link>
            <Link href="/admin/facilities" className={styles.sidebarLink} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>Selamat datang kembali, {session.user.name}</p>
          </div>
        </div>

        <div className={styles.pageContent}>
          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={22} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats?.totalBookings || 0}</span>
                <span className={styles.statLabel}>Total Booking</span>
              </div>
              {stats && stats.bookingTrend !== 0 && (
                <span className={`${styles.statTrend} ${stats.bookingTrend > 0 ? styles.statTrendUp : styles.statTrendDown}`}>
                  {stats.bookingTrend > 0 ? '↑' : '↓'} {Math.abs(stats.bookingTrend)}%
                </span>
              )}
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconYellow}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hourglass size={22} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats?.pendingBookings || 0}</span>
                <span className={styles.statLabel}>Menunggu Persetujuan</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Coins size={22} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{formatCurrency(stats?.totalRevenue || 0)}</span>
                <span className={styles.statLabel}>Total Pendapatan</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats?.totalUsers || 0}</span>
                <span className={styles.statLabel}>Total Pengguna</span>
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            {/* Recent Bookings */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Booking Terbaru</h2>
                <Link href="/admin/bookings" className={styles.cardLink}>Lihat Semua →</Link>
              </div>
              <div className={styles.cardBody}>
                {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                  <div className={styles.bookingList}>
                    {stats.recentBookings.slice(0, 8).map((booking: any) => (
                      <div key={booking.id} className={styles.bookingItem}>
                        <div className={styles.bookingItemLeft}>
                          <div className={styles.bookingItemAvatar}>
                            {booking.user.name.charAt(0)}
                          </div>
                          <div>
                            <p className={styles.bookingItemTitle}>{booking.title}</p>
                            <p className={styles.bookingItemMeta}>
                              {booking.user.name} · {booking.facility.name}
                            </p>
                          </div>
                        </div>
                        <div className={styles.bookingItemRight}>
                          <span className={`${styles.bookingItemStatus} ${styles[`status${booking.status}`]}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                          <span className={styles.bookingItemDate}>
                            {formatDate(booking.createdAt, { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>Belum ada booking</p>
                  </div>
                )}
              </div>
            </div>

            {/* Facility Stats */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Fasilitas Terpopuler</h2>
              </div>
              <div className={styles.cardBody}>
                {stats?.facilityChart && stats.facilityChart.length > 0 ? (
                  <div className={styles.facilityStats}>
                    {stats.facilityChart.map((item: any, index: number) => {
                      const maxVal = Math.max(...stats.facilityChart.map((f: any) => f.value))
                      const percentage = maxVal > 0 ? (item.value / maxVal) * 100 : 0
                      const colors = ['#15803d', '#eab308', '#22c55e', '#facc15', '#16a34a', '#8b5cf6']
                      return (
                        <div key={item.name} className={styles.facilityStatItem}>
                          <div className={styles.facilityStatHeader}>
                            <span className={styles.facilityStatName}>{item.name}</span>
                            <span className={styles.facilityStatValue}>{item.value} booking</span>
                          </div>
                          <div className={styles.facilityStatBar}>
                            <div
                              className={styles.facilityStatBarFill}
                              style={{
                                width: `${percentage}%`,
                                background: colors[index % colors.length],
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>Belum ada data</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
