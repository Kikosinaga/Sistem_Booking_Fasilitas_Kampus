import Link from 'next/link'
import { getFacilities } from '@/actions/booking'
import { auth } from '@/lib/auth'
import { signOut } from '@/lib/auth'
import { formatCurrency, getFacilityTypeLabel } from '@/lib/utils'
import styles from './facilities.module.css'
import { 
  MapPin, Users, Clock, Construction, Landmark, Trophy, Building, School, Activity 
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

export default async function FacilitiesPage() {
  const session = await auth()
  let facilities: any[] = []
  try {
    facilities = await getFacilities()
  } catch (e) {}

  return (
    <div className={styles.page}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link href="/" className={styles.navBrand}>
            <div className={styles.navLogo}>
              <img src="/logo-uir.png" alt="Logo UIR" width={32} height={32} style={{ objectFit: 'contain' }} />
            </div>
            <span>BookingKampus</span>
          </Link>
          <div className={styles.navLinks}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/facilities" className={`${styles.navLink} ${styles.navLinkActive}`}>Fasilitas</Link>
          </div>
          <div className={styles.navActions}>
            {session?.user ? (
              <>
                <span className={styles.navUser}>{session.user.name}</span>
                <form action={async () => { 'use server'; await signOut({ redirectTo: '/login' }) }}>
                  <button type="submit" className={styles.navLogoutBtn}>Keluar</button>
                </form>
              </>
            ) : (
              <Link href="/login" className={styles.navLoginBtn}>Masuk</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.headerTitle}>Fasilitas Kampus</h1>
          <p className={styles.headerSubtitle}>
            Pilih fasilitas yang Anda butuhkan dan cek ketersediaan jadwal
          </p>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className={styles.facilitiesSection}>
        <div className={styles.container}>
          <div className={styles.facilityGrid}>
            {facilities.map((facility: any) => (
              <Link key={facility.id} href={`/facilities/${facility.slug}`} className={styles.facilityCard}>
                <div className={styles.facilityImage}>
                  {facility.images && Array.isArray(facility.images) && facility.images[0] ? (
                    <img
                      src={facility.images[0]}
                      alt={facility.name}
                      className={styles.facilityImageReal}
                    />
                  ) : (
                    <span className={styles.facilityEmoji} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
                      <FacilityIcon type={facility.type} size={48} />
                    </span>
                  )}
                  <div className={styles.facilityType}>
                    {getFacilityTypeLabel(facility.type)}
                  </div>
                </div>
                <div className={styles.facilityBody}>
                  <h3 className={styles.facilityName}>{facility.name}</h3>
                  <p className={styles.facilityLocation} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} />
                    {facility.location}
                  </p>
                  <p className={styles.facilityDesc}>
                    {facility.description.slice(0, 100)}...
                  </p>
                  <div className={styles.facilityMeta}>
                    <div className={styles.facilityMetaItem} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span>{facility.capacity} orang</span>
                    </div>
                    <div className={styles.facilityMetaItem} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span>{facility.openTime} - {facility.closeTime}</span>
                    </div>
                  </div>
                  <div className={styles.facilityFooter}>
                    <div className={styles.facilityPrice}>
                      {facility.pricePerHour > 0 ? (
                        <>
                          <span className={styles.priceAmount}>{formatCurrency(facility.pricePerHour)}</span>
                          <span className={styles.priceUnit}>/jam</span>
                        </>
                      ) : (
                        <span className={styles.priceFree}>Gratis</span>
                      )}
                    </div>
                    <span className={styles.facilityBtn}>Lihat Detail →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {facilities.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                <Construction size={48} />
              </div>
              <h3>Fasilitas belum tersedia</h3>
              <p>Database perlu di-seed terlebih dahulu. Jalankan: npx prisma db seed</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
