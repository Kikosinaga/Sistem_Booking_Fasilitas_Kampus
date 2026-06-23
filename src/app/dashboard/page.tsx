import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserBookings } from '@/actions/booking'
import { getNotifications } from '@/actions/admin'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import styles from './dashboard.module.css'
import PayButton from './PayButton'
import { formatDate, formatTime, getBookingStatusLabel, getBookingStatusColor, formatCurrency } from '@/lib/utils'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role === 'ADMIN') redirect('/admin/dashboard')

  const bookings = await getUserBookings()
  const notifications = await getNotifications()
  const unreadCount = notifications.filter((n: any) => !n.isRead).length

  const activeBookings = bookings.filter((b: any) =>
    ['PENDING', 'APPROVED', 'PAID', 'ACTIVE'].includes(b.status)
  )
  const completedBookings = bookings.filter((b: any) =>
    ['COMPLETED', 'CANCELLED', 'REJECTED'].includes(b.status)
  )

  return (
    <div className={styles.dashboardPage}>
      {/* Top Navigation */}
      <nav className={styles.topNav}>
        <div className={styles.topNavContainer}>
          <Link href="/" className={styles.topNavBrand}>
            <div className={styles.topNavLogo}>
              <img src="/logo-uir.png" alt="Logo UIR" width={28} height={28} style={{ objectFit: 'contain' }} />
            </div>
            <span>BookingKampus</span>
          </Link>
          <div className={styles.topNavLinks}>
            <Link href="/dashboard" className={`${styles.topNavLink} ${styles.topNavLinkActive}`}>Dashboard</Link>
            <Link href="/facilities" className={styles.topNavLink}>Fasilitas</Link>
          </div>
          <div className={styles.topNavActions}>
            <div className={styles.notifBadge}>
              🔔
              {unreadCount > 0 && <span className={styles.notifCount}>{unreadCount}</span>}
            </div>
            <div className={styles.userMenuArea}>
              <div className={styles.userAvatar}>
                {session.user.name?.charAt(0).toUpperCase()}
              </div>
              <div className={styles.userInfoArea}>
                <span className={styles.userName}>{session.user.name}</span>
                <span className={styles.userRole}>{session.user.role}</span>
              </div>
            </div>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
              <button type="submit" className={styles.logoutBtn}>Keluar</button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.pageContainer}>
          {/* Welcome */}
          <div className={styles.welcomeSection}>
            <div>
              <h1 className={styles.welcomeTitle}>Halo, {session.user.name}! 👋</h1>
              <p className={styles.welcomeSubtitle}>Kelola booking fasilitas kampus Anda di sini</p>
            </div>
            <Link href="/facilities" className={styles.newBookingBtn}>
              + Booking Baru
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>📋</div>
              <div>
                <div className={styles.statValue}>{bookings.length}</div>
                <div className={styles.statLabel}>Total Booking</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconYellow}`}>⏳</div>
              <div>
                <div className={styles.statValue}>
                  {bookings.filter((b: any) => b.status === 'PENDING').length}
                </div>
                <div className={styles.statLabel}>Menunggu</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✅</div>
              <div>
                <div className={styles.statValue}>
                  {bookings.filter((b: any) => ['APPROVED', 'PAID', 'ACTIVE'].includes(b.status)).length}
                </div>
                <div className={styles.statLabel}>Aktif</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`}>🏁</div>
              <div>
                <div className={styles.statValue}>
                  {bookings.filter((b: any) => b.status === 'COMPLETED').length}
                </div>
                <div className={styles.statLabel}>Selesai</div>
              </div>
            </div>
          </div>

          {/* Active Bookings */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              Booking Aktif
              <span className={styles.sectionCount}>{activeBookings.length}</span>
            </h2>
            {activeBookings.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📅</div>
                <h3>Belum ada booking aktif</h3>
                <p>Mulai booking fasilitas kampus sekarang</p>
                <Link href="/facilities" className={styles.emptyBtn}>
                  Lihat Fasilitas
                </Link>
              </div>
            ) : (
              <div className={styles.bookingGrid}>
                {activeBookings.map((booking: any) => (
                  <div key={booking.id} className={styles.bookingCard}>
                    <div className={styles.bookingCardHeader}>
                      <span className={`${styles.bookingStatus} ${styles[`status${booking.status}`]}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                      {booking.qrVerification && (
                        <span className={styles.qrBadge}>📱 QR Ready</span>
                      )}
                    </div>
                    <h3 className={styles.bookingTitle}>{booking.title}</h3>
                    <p className={styles.bookingFacility}>🏛️ {booking.facility.name}</p>
                    <div className={styles.bookingMeta}>
                      <span>📅 {formatDate(booking.startTime)}</span>
                      <span>🕐 {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                    </div>
                    {booking.totalPrice > 0 && (
                      <div className={styles.bookingPrice}>
                        💰 {formatCurrency(booking.totalPrice)}
                        <span className={styles.paymentStatus}>
                          {booking.paymentStatus === 'PAID' ? '✅ Lunas' : '⏳ Belum bayar'}
                        </span>
                        {booking.status === 'APPROVED' && booking.paymentStatus !== 'PAID' && (
                          <PayButton bookingId={booking.id} />
                        )}
                      </div>
                    )}
                    {booking.isFree && (
                      <div className={styles.bookingFree}>🎓 Gratis (Mahasiswa/Dosen)</div>
                    )}
                    {booking.documents && booking.documents.length > 0 && (
                      <div className={styles.bookingDocs}>
                        {booking.documents.map((doc: any) => (
                          <a
                            key={doc.id}
                            href={`/view-document?file=${encodeURIComponent(doc.fileUrl)}&title=${encodeURIComponent(doc.documentType === 'KTM' ? 'KTM' : doc.documentType === 'PROPOSAL' ? 'Proposal' : 'Dokumen')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.bookingDocBadge}
                          >
                            {doc.documentType === 'KTM' ? '🪪 KTM' :
                              doc.documentType === 'PROPOSAL' ? '📋 Proposal' :
                                doc.documentType === 'PAYMENT_PROOF' ? '🧾 Bukti Bayar' :
                                  `📄 ${doc.fileName}`}
                          </a>
                        ))}
                        {booking.paymentMethod && booking.paymentMethod !== 'FREE' && (
                          <span className={styles.bookingPaymentMethod}>
                            {booking.paymentMethod === 'BANK_TRANSFER' ? '🏦 Transfer Bank' :
                              booking.paymentMethod === 'QRIS' ? '📱 QRIS' :
                                booking.paymentMethod === 'EWALLET' ? '💰 E-Wallet' : booking.paymentMethod}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Booking History */}
          {completedBookings.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Riwayat Booking
                <span className={styles.sectionCount}>{completedBookings.length}</span>
              </h2>
              <div className={styles.bookingGrid}>
                {completedBookings.slice(0, 6).map((booking: any) => (
                  <div key={booking.id} className={`${styles.bookingCard} ${styles.bookingCardFaded}`}>
                    <div className={styles.bookingCardHeader}>
                      <span className={`${styles.bookingStatus} ${styles[`status${booking.status}`]}`}>
                        {getBookingStatusLabel(booking.status)}
                      </span>
                    </div>
                    <h3 className={styles.bookingTitle}>{booking.title}</h3>
                    <p className={styles.bookingFacility}>🏛️ {booking.facility.name}</p>
                    <div className={styles.bookingMeta}>
                      <span>📅 {formatDate(booking.startTime)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Notifications */}
          {notifications.length > 0 && (
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Notifikasi Terbaru</h2>
              <div className={styles.notifList}>
                {notifications.slice(0, 5).map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`${styles.notifItem} ${!notif.isRead ? styles.notifUnread : ''}`}
                  >
                    <div className={styles.notifIcon}>
                      {notif.type === 'BOOKING_APPROVED' ? '✅' :
                        notif.type === 'BOOKING_REJECTED' ? '❌' :
                          notif.type === 'BOOKING_SUBMITTED' ? '📋' :
                            notif.type === 'PAYMENT_RECEIVED' ? '💰' : '🔔'}
                    </div>
                    <div className={styles.notifContent}>
                      <p className={styles.notifTitle}>{notif.title}</p>
                      <p className={styles.notifMessage}>{notif.message}</p>
                      <p className={styles.notifTime}>{formatDate(notif.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
