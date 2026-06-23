import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllBookings, approveBooking, rejectBooking } from '@/actions/admin'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import styles from '../dashboard/admin.module.css'
import bookingStyles from './bookings.module.css'
import { formatDate, formatTime, getBookingStatusLabel, formatCurrency, getRoleLabel } from '@/lib/utils'

export default async function AdminBookingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/login')

  const bookings = await getAllBookings()

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
            <Link href="/admin/dashboard" className={styles.sidebarLink}>
              <span>📊</span> Dashboard
            </Link>
            <Link href="/admin/bookings" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`}>
              <span>📋</span> Booking
            </Link>
            <Link href="/admin/facilities" className={styles.sidebarLink}>
              <span>🏢</span> Fasilitas
            </Link>
          </div>
          <div className={styles.sidebarSection}>
            <span className={styles.sidebarSectionTitle}>Lainnya</span>
            <Link href="/" className={styles.sidebarLink}>
              <span>🌐</span> Lihat Website
            </Link>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
              <button type="submit" className={styles.sidebarLink} style={{ width: '100%' }}>
                <span>🚪</span> Keluar
              </button>
            </form>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Kelola Booking</h1>
            <p className={styles.pageSubtitle}>{bookings.length} total booking</p>
          </div>
        </div>

        <div className={styles.pageContent}>
          {bookings.length === 0 ? (
            <div className={bookingStyles.emptyState}>
              <div className={bookingStyles.emptyIcon}>📋</div>
              <h3>Belum ada booking</h3>
              <p>Booking akan muncul di sini ketika pengguna mengajukan peminjaman fasilitas</p>
            </div>
          ) : (
            <div className={bookingStyles.bookingsTable}>
              <div className={bookingStyles.tableWrapper}>
                <table className={bookingStyles.table}>
                  <thead>
                    <tr>
                      <th>Kegiatan</th>
                      <th>Pemohon</th>
                      <th>Fasilitas</th>
                      <th>Waktu</th>
                      <th>Harga</th>
                      <th>Dokumen</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking: any) => (
                      <tr key={booking.id}>
                        <td>
                          <div className={bookingStyles.cellTitle}>{booking.title}</div>
                          <div className={bookingStyles.cellMeta}>
                            {formatDate(booking.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td>
                          <div className={bookingStyles.userCell}>
                            <div className={bookingStyles.userCellAvatar}>
                              {booking.user.name.charAt(0)}
                            </div>
                            <div>
                              <div className={bookingStyles.cellTitle}>{booking.user.name}</div>
                              <div className={bookingStyles.cellMeta}>
                                {getRoleLabel(booking.user.role)}
                                {booking.user.nim && ` · ${booking.user.nim}`}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={bookingStyles.cellTitle}>{booking.facility.name}</div>
                        </td>
                        <td>
                          <div className={bookingStyles.cellTitle}>
                            {formatDate(booking.startTime, { day: 'numeric', month: 'short' })}
                          </div>
                          <div className={bookingStyles.cellMeta}>
                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                          </div>
                        </td>
                        <td>
                          {booking.isFree ? (
                            <span className={bookingStyles.freeBadge}>Gratis</span>
                          ) : (
                            <span className={bookingStyles.priceBadge}>{formatCurrency(booking.totalPrice)}</span>
                          )}
                        </td>
                        <td>
                          <div className={bookingStyles.docBadges}>
                            {booking.documents && booking.documents.length > 0 ? (
                              <>
                                {booking.documents.map((doc: any) => (
                                  <a
                                    key={doc.id}
                                    href={`/view-document?file=${encodeURIComponent(doc.fileUrl)}&title=${encodeURIComponent(`${doc.documentType === 'KTM' ? 'KTM' : doc.documentType === 'PROPOSAL' ? 'Proposal' : 'Dokumen'} - ${booking.user.name}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${bookingStyles.docBadge} ${
                                      doc.documentType === 'KTM' ? bookingStyles.docBadgeKtm :
                                      doc.documentType === 'PROPOSAL' ? bookingStyles.docBadgeProposal :
                                      doc.documentType === 'PAYMENT_PROOF' ? bookingStyles.docBadgePayment :
                                      ''
                                    }`}
                                    title={`Lihat ${doc.documentType === 'KTM' ? 'KTM' : doc.documentType === 'PROPOSAL' ? 'Proposal' : doc.documentType === 'PAYMENT_PROOF' ? 'Bukti Bayar' : doc.fileName}`}
                                  >
                                    {doc.documentType === 'KTM' ? '🪪 KTM' :
                                     doc.documentType === 'PROPOSAL' ? '📋 Proposal' :
                                     doc.documentType === 'PAYMENT_PROOF' ? '🧾 Bukti Bayar' :
                                     `📄 ${doc.fileName}`}
                                  </a>
                                ))}
                                {booking.paymentMethod && booking.paymentMethod !== 'FREE' && (
                                  <span className={bookingStyles.paymentMethodBadge}>
                                    {booking.paymentMethod === 'BANK_TRANSFER' ? '🏦 Transfer' :
                                     booking.paymentMethod === 'QRIS' ? '📱 QRIS' :
                                     booking.paymentMethod === 'EWALLET' ? '💰 E-Wallet' : booking.paymentMethod}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className={bookingStyles.cellMeta}>—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`${bookingStyles.statusBadge} ${bookingStyles[`status${booking.status}`]}`}>
                            {getBookingStatusLabel(booking.status)}
                          </span>
                        </td>
                        <td>
                          {booking.status === 'PENDING' && (
                            <div className={bookingStyles.actionButtons}>
                              <form action={async () => { 'use server'; await approveBooking(booking.id) }}>
                                <button type="submit" className={bookingStyles.approveBtn}>
                                  ✅ Setujui
                                </button>
                              </form>
                              <form action={async () => { 'use server'; await rejectBooking(booking.id, 'Ditolak oleh admin') }}>
                                <button type="submit" className={bookingStyles.rejectBtn}>
                                  ❌ Tolak
                                </button>
                              </form>
                            </div>
                          )}
                          {booking.status === 'APPROVED' && booking.paymentStatus !== 'PAID' && (
                            <div className={bookingStyles.actionButtons}>
                              <form action={async () => { 'use server'; await rejectBooking(booking.id, 'Ditolak oleh admin') }}>
                                <button type="submit" className={bookingStyles.rejectBtn}>
                                  ❌ Batalkan
                                </button>
                              </form>
                            </div>
                          )}
                          {booking.status !== 'PENDING' && !(booking.status === 'APPROVED' && booking.paymentStatus !== 'PAID') && (
                            <span className={bookingStyles.cellMeta}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
