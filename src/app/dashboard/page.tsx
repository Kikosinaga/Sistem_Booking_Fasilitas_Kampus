import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getUserBookings } from '@/actions/booking'
import { getNotifications } from '@/actions/admin'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import styles from './dashboard.module.css'
import PayButton from './PayButton'
import NotificationBell from './NotificationBell'
import { formatDate, formatTime, getBookingStatusLabel, getBookingStatusColor, formatCurrency } from '@/lib/utils'
import { 
  Bell, ClipboardList, Hourglass, CheckCircle, Flag, Calendar, 
  Smartphone, Landmark, Trophy, Building, School, Activity, Coins, 
  Clock, GraduationCap, Contact, FileText, Receipt, QrCode, XCircle
} from 'lucide-react'

function FacilityIcon({ type, size = 16, className, style }: { type: string, size?: number, className?: string, style?: React.CSSProperties }) {
  switch (type?.toUpperCase()) {
    case 'AULA':
      return <Landmark size={size} className={className} style={style} />
    case 'GOR':
      return <Trophy size={size} className={className} style={style} />
    case 'LAPANGAN':
      return <Activity size={size} className={className} style={style} />
    case 'GEDUNG':
      return <Building size={size} className={className} style={style} />
    default:
      return <School size={size} className={className} style={style} />
  }
}

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
            <NotificationBell initialUnreadCount={unreadCount} />
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
              <h1 className={styles.welcomeTitle}>Halo, {session.user.name}!</h1>
              <p className={styles.welcomeSubtitle}>Kelola booking fasilitas kampus Anda di sini</p>
            </div>
            <Link href="/facilities" className={styles.newBookingBtn}>
              + Booking Baru
            </Link>
          </div>

          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={22} />
              </div>
              <div>
                <div className={styles.statValue}>{bookings.length}</div>
                <div className={styles.statLabel}>Total Booking</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconYellow}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hourglass size={22} />
              </div>
              <div>
                <div className={styles.statValue}>
                  {bookings.filter((b: any) => b.status === 'PENDING').length}
                </div>
                <div className={styles.statLabel}>Menunggu</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={22} />
              </div>
              <div>
                <div className={styles.statValue}>
                  {bookings.filter((b: any) => ['APPROVED', 'PAID', 'ACTIVE'].includes(b.status)).length}
                </div>
                <div className={styles.statLabel}>Aktif</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPurple}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flag size={22} />
              </div>
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
                <div className={styles.emptyIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  <Calendar size={48} />
                </div>
                <h3>Belum ada booking aktif</h3>
                <p>Mulai booking fasilitas kampus sekarang</p>
                <Link href="/facilities" className={styles.emptyBtn}>
                  Lihat Fasilitas
                </Link>
              </div>
            ) : (
              <div className={styles.bookingGrid}>
                {activeBookings.map((booking: any) => {
                  const isApprovedOrPaidFree = booking.isFree && ['APPROVED', 'PAID'].includes(booking.status);
                  const badgeClass = isApprovedOrPaidFree ? styles.statusPAID : styles[`status${booking.status}`];
                  const badgeText = isApprovedOrPaidFree ? 'DISETUJUI' : getBookingStatusLabel(booking.status);

                  return (
                    <div key={booking.id} className={styles.bookingCard}>
                      <div className={styles.bookingCardHeader}>
                        <span className={`${styles.bookingStatus} ${badgeClass}`}>
                          {badgeText}
                        </span>
                        {booking.qrVerification && !booking.isFree && (
                          <span className={styles.qrBadge} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <QrCode size={12} />
                            <span>QR Ready</span>
                          </span>
                        )}
                      </div>
                    <h3 className={styles.bookingTitle}>{booking.title}</h3>
                    <p className={styles.bookingFacility} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FacilityIcon type={booking.facility.type || booking.facility.facilityType} size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span>{booking.facility.name}</span>
                    </p>
                    <div className={styles.bookingMeta}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>{formatDate(booking.startTime)}</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        <span>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</span>
                      </span>
                    </div>
                    {booking.totalPrice > 0 && (
                      <div className={styles.bookingPrice}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Coins size={14} style={{ color: 'var(--primary-600)' }} />
                          <span>{formatCurrency(booking.totalPrice)}</span>
                        </div>
                        <span className={styles.paymentStatus} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {booking.paymentStatus === 'PAID' ? (
                            <>
                              <CheckCircle size={12} style={{ color: 'var(--success-color)' }} />
                              <span>Lunas</span>
                            </>
                          ) : (
                            <>
                              <Hourglass size={12} style={{ color: 'var(--warning-color)' }} />
                              <span>Belum bayar</span>
                            </>
                          )}
                        </span>
                        {booking.status === 'APPROVED' && booking.paymentStatus !== 'PAID' && (
                          <PayButton bookingId={booking.id} />
                        )}
                      </div>
                    )}
                    {booking.isFree && (
                      <div className={styles.bookingFree} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <GraduationCap size={14} />
                        <span>Gratis (Mahasiswa/Dosen)</span>
                      </div>
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
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {doc.documentType === 'KTM' ? (
                              <>
                                <Contact size={12} />
                                <span>KTM</span>
                              </>
                            ) : doc.documentType === 'PROPOSAL' ? (
                              <>
                                <ClipboardList size={12} />
                                <span>Proposal</span>
                              </>
                            ) : doc.documentType === 'PAYMENT_PROOF' ? (
                              <>
                                <Receipt size={12} />
                                <span>Bukti Bayar</span>
                              </>
                            ) : (
                              <>
                                <FileText size={12} />
                                <span>{doc.fileName.slice(0, 10)}...</span>
                              </>
                            )}
                          </a>
                        ))}
                        {booking.paymentMethod && booking.paymentMethod !== 'FREE' && (
                          <span className={styles.bookingPaymentMethod} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            {booking.paymentMethod === 'BANK_TRANSFER' ? (
                              <>
                                <Landmark size={12} />
                                <span>Transfer Bank</span>
                              </>
                            ) : booking.paymentMethod === 'QRIS' ? (
                              <>
                                <Smartphone size={12} />
                                <span>QRIS</span>
                              </>
                            ) : booking.paymentMethod === 'EWALLET' ? (
                              <>
                                <Coins size={12} />
                                <span>E-Wallet</span>
                              </>
                            ) : (
                              <span>{booking.paymentMethod}</span>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
                {completedBookings.slice(0, 6).map((booking: any) => {
                  const isApprovedOrPaidFree = booking.isFree && ['APPROVED', 'PAID'].includes(booking.status);
                  const badgeClass = isApprovedOrPaidFree ? styles.statusPAID : styles[`status${booking.status}`];
                  const badgeText = isApprovedOrPaidFree ? 'DISETUJUI' : getBookingStatusLabel(booking.status);

                  return (
                    <div key={booking.id} className={`${styles.bookingCard} ${styles.bookingCardFaded}`}>
                      <div className={styles.bookingCardHeader}>
                        <span className={`${styles.bookingStatus} ${badgeClass}`}>
                          {badgeText}
                        </span>
                      </div>
                    <h3 className={styles.bookingTitle}>{booking.title}</h3>
                    <p className={styles.bookingFacility} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FacilityIcon type={booking.facility.type || booking.facility.facilityType} size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span>{booking.facility.name}</span>
                    </p>
                    <div className={styles.bookingMeta}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>{formatDate(booking.startTime)}</span>
                      </span>
                    </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recent Notifications */}
          {notifications.length > 0 && (
            <section id="notifications" className={styles.section}>
              <h2 className={styles.sectionTitle}>Notifikasi Terbaru</h2>
              <div className={styles.notifList}>
                {notifications.slice(0, 5).map((notif: any) => (
                  <div
                    key={notif.id}
                    className={`${styles.notifItem} ${!notif.isRead ? styles.notifUnread : ''}`}
                  >
                    <div className={styles.notifIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {notif.type === 'BOOKING_APPROVED' ? <CheckCircle size={18} style={{ color: 'var(--success-color)' }} /> :
                        notif.type === 'BOOKING_REJECTED' ? <XCircle size={18} style={{ color: 'var(--error-color)' }} /> :
                          notif.type === 'BOOKING_SUBMITTED' ? <ClipboardList size={18} style={{ color: 'var(--primary-600)' }} /> :
                            notif.type === 'PAYMENT_RECEIVED' ? <Coins size={18} style={{ color: 'var(--primary-600)' }} /> : 
                              <Bell size={18} style={{ color: 'var(--text-secondary)' }} />}
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
