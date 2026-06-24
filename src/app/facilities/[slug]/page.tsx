import { auth } from '@/lib/auth'
import { getFacilityBySlug } from '@/actions/booking'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency, getFacilityTypeLabel } from '@/lib/utils'
import BookingForm from './BookingForm'
import styles from './detail.module.css'
import { 
  MapPin, Users, Clock, Coins, Landmark, Trophy, Building, School, Activity 
} from 'lucide-react'

function FacilityIcon({ type, size = 24, className, style }: { type: string, size?: number, className?: string, style?: React.CSSProperties }) {
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

export default async function FacilityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await auth()
  const facility = await getFacilityBySlug(slug)

  if (!facility) notFound()

  const images = facility.images as string[] | null

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.navBrand}>
            <span className={styles.navLogo}>
              <img src="/logo-uir.png" alt="Logo UIR" width={32} height={32} style={{ objectFit: 'contain' }} />
            </span>
            <span>BookingKampus</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/facilities" className={styles.navLink}>← Kembali ke Fasilitas</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        {images && Array.isArray(images) && images[0] ? (
          <img
            src={images[0]}
            alt={facility.name}
            className={styles.heroImage}
          />
        ) : (
          <div className={styles.heroEmoji} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
            <FacilityIcon type={facility.type} size={80} />
          </div>
        )}
      </section>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Left Column - Info */}
            <div className={styles.infoColumn}>
              <div className={styles.typeBadge}>{getFacilityTypeLabel(facility.type)}</div>
              <h1 className={styles.title}>{facility.name}</h1>
              <p className={styles.location} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} style={{ color: 'var(--text-tertiary)' }} />
                {facility.location}
              </p>

              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={20} style={{ color: 'var(--primary-600)' }} />
                  </span>
                  <div>
                    <span className={styles.metaValue}>{facility.capacity}</span>
                    <span className={styles.metaLabel}>Kapasitas</span>
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={20} style={{ color: 'var(--primary-600)' }} />
                  </span>
                  <div>
                    <span className={styles.metaValue}>{facility.openTime} - {facility.closeTime}</span>
                    <span className={styles.metaLabel}>Jam Operasional</span>
                  </div>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Coins size={20} style={{ color: 'var(--primary-600)' }} />
                  </span>
                  <div>
                    <span className={styles.metaValue}>
                      {facility.pricePerHour > 0
                        ? `${formatCurrency(facility.pricePerHour)}/jam`
                        : 'Gratis'}
                    </span>
                    <span className={styles.metaLabel}>Harga Sewa</span>
                  </div>
                </div>
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Deskripsi</h2>
                <p className={styles.description}>{facility.description}</p>
              </div>

              {Array.isArray(facility.amenities) && facility.amenities.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Fasilitas Tersedia</h2>
                  <div className={styles.amenityGrid}>
                    {(facility.amenities as string[]).map((amenity: string) => (
                      <span key={amenity} className={styles.amenityTag}>
                        ✓ {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {facility.rules && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Peraturan Penggunaan</h2>
                  <div className={styles.rulesBox}>
                    <p>{facility.rules}</p>
                  </div>
                </div>
              )}

              {/* Upcoming Bookings */}
              {facility.bookings && facility.bookings.length > 0 && (
                <div className={styles.section}>
                  <h2 className={styles.sectionTitle}>Jadwal Terisi</h2>
                  <div className={styles.scheduleList}>
                    {facility.bookings.map((booking: any) => (
                      <div key={booking.id} className={styles.scheduleItem}>
                        <div className={styles.scheduleDate}>
                          {new Date(booking.startTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </div>
                        <div>
                          <p className={styles.scheduleTitle}>{booking.title}</p>
                          <p className={styles.scheduleTime}>
                            {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -
                            {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Booking Form */}
            <div className={styles.bookingColumn}>
              <div className={styles.bookingCard}>
                <div className={styles.bookingCardHeader}>
                  <h2>Booking Fasilitas</h2>
                  <div className={styles.bookingPrice}>
                    {facility.pricePerHour > 0 ? (
                      <>
                        <span className={styles.priceAmount}>{formatCurrency(facility.pricePerHour)}</span>
                        <span className={styles.priceUnit}>/jam</span>
                      </>
                    ) : (
                      <span className={styles.priceFree}>Gratis</span>
                    )}
                  </div>
                </div>

                {session?.user ? (
                  <BookingForm facility={facility} userRole={session.user.role} />
                ) : (
                  <div className={styles.loginPrompt}>
                    <p>Silakan login untuk melakukan booking</p>
                    <Link href="/login" className={styles.loginBtn}>
                      Masuk untuk Booking
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
