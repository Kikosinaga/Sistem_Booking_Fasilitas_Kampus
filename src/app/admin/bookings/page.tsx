import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllBookings, approveBooking, rejectBooking } from '@/actions/admin'
import { signOut } from '@/lib/auth'
import Link from 'next/link'
import styles from '../dashboard/admin.module.css'
import bookingStyles from './bookings.module.css'
import { formatDate, formatTime, getBookingStatusLabel, formatCurrency, getRoleLabel } from '@/lib/utils'
import { 
  BarChart3, ClipboardList, Building2, Globe, LogOut, FileText, 
  CheckSquare, XSquare, Contact, Receipt, Landmark, Smartphone, Coins 
} from 'lucide-react'
import ExportPDFButton from './ExportPDFButton'

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
            <Link href="/admin/dashboard" className={styles.sidebarLink} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={16} /> Dashboard
            </Link>
            <Link href="/admin/bookings" className={`${styles.sidebarLink} ${styles.sidebarLinkActive}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={16} /> Booking
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
            <h1 className={styles.pageTitle}>Kelola Booking</h1>
            <p className={styles.pageSubtitle}>{bookings.length} total booking</p>
          </div>
          <ExportPDFButton />
        </div>

        <div className={styles.pageContent}>
          {bookings.length === 0 ? (
            <div className={bookingStyles.emptyState}>
              <div className={bookingStyles.emptyIcon} style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                <ClipboardList size={48} />
              </div>
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
                                    {doc.documentType === 'KTM' ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Contact size={12} /> KTM
                                      </span>
                                    ) : doc.documentType === 'PROPOSAL' ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <ClipboardList size={12} /> Proposal
                                      </span>
                                    ) : doc.documentType === 'PAYMENT_PROOF' ? (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <Receipt size={12} /> Bukti Bayar
                                      </span>
                                    ) : (
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <FileText size={12} /> {doc.fileName.slice(0, 8)}...
                                      </span>
                                    )}
                                  </a>
                                ))}
                                {booking.paymentMethod && booking.paymentMethod !== 'FREE' && (
                                  <span className={bookingStyles.paymentMethodBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    {booking.paymentMethod === 'BANK_TRANSFER' ? (
                                      <>
                                        <Landmark size={12} />
                                        <span>Transfer</span>
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
                              </>
                            ) : (
                              <span className={bookingStyles.cellMeta}>—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`${bookingStyles.statusBadge} ${
                            booking.isFree && ['APPROVED', 'PAID'].includes(booking.status)
                              ? bookingStyles.statusPAID
                              : bookingStyles[`status${booking.status}`]
                          }`}>
                            {booking.isFree && ['APPROVED', 'PAID'].includes(booking.status) ? 'Disetujui' : getBookingStatusLabel(booking.status)}
                          </span>
                        </td>
                        <td>
                          {booking.status === 'PENDING' && (
                            <div className={bookingStyles.actionButtons}>
                              <form action={async () => { 'use server'; await approveBooking(booking.id) }}>
                                <button type="submit" className={bookingStyles.approveBtn} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <CheckSquare size={14} /> Setujui
                                </button>
                              </form>
                              <form action={async () => { 'use server'; await rejectBooking(booking.id, 'Ditolak oleh admin') }}>
                                <button type="submit" className={bookingStyles.rejectBtn} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <XSquare size={14} /> Tolak
                                </button>
                              </form>
                            </div>
                          )}
                          {booking.status === 'APPROVED' && booking.paymentStatus !== 'PAID' && (
                            <div className={bookingStyles.actionButtons}>
                              <form action={async () => { 'use server'; await rejectBooking(booking.id, 'Ditolak oleh admin') }}>
                                <button type="submit" className={bookingStyles.rejectBtn} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <XSquare size={14} /> Batalkan
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
