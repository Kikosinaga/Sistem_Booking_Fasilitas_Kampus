import Link from 'next/link'
import { getFacilities } from '@/actions/booking'
import styles from './page.module.css'
import { 
  MapPin, Users, KeyRound, Calendar, CheckCircle, Smartphone, 
  RefreshCw, CreditCard, Bell, BarChart3, GraduationCap, Mail, Phone,
  Building, Landmark, Trophy, School, Activity
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

export default async function HomePage() {
  let facilities: any[] = []
  try {
    facilities = await getFacilities()
  } catch (e) {
    // DB might not be seeded yet
  }

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
            <Link href="#facilities" className={styles.navLink}>Fasilitas</Link>
            <Link href="#how-it-works" className={styles.navLink}>Cara Booking</Link>
            <Link href="#stats" className={styles.navLink}>Statistik</Link>
          </div>
          <div className={styles.navActions}>
            <Link href="/login" className={styles.navLoginBtn}>Masuk</Link>
            <Link href="/register" className={styles.navRegisterBtn}>Daftar</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroBgOrb1}></div>
          <div className={styles.heroBgOrb2}></div>
          <div className={styles.heroBgOrb3}></div>
          <div className={styles.heroGrid}></div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot}></span>
            Sistem Booking Online
          </div>
          <h1 className={styles.heroTitle}>
            Booking Fasilitas<br />
            <span className={styles.heroTitleAccent}>Kampus</span> Jadi Mudah
          </h1>
          <p className={styles.heroSubtitle}>
            Pesan aula, gedung, lapangan, dan berbagai fasilitas kampus secara online.
            Cepat, transparan, dan tanpa ribet.
          </p>
          <div className={styles.heroButtons}>
            <Link href="/register" className={styles.heroPrimaryBtn}>
              Mulai Booking
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="#facilities" className={styles.heroSecondaryBtn}>
              Lihat Fasilitas
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>6+</span>
              <span className={styles.heroStatLabel}>Fasilitas</span>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>24/7</span>
              <span className={styles.heroStatLabel}>Online Booking</span>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>100%</span>
              <span className={styles.heroStatLabel}>Gratis Mahasiswa</span>
            </div>
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section id="facilities" className={styles.facilities}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Fasilitas Tersedia</span>
            <h2 className={styles.sectionTitle}>Pilih Fasilitas yang Anda Butuhkan</h2>
            <p className={styles.sectionSubtitle}>
              Berbagai fasilitas kampus siap mendukung kegiatan akademik dan non-akademik Anda
            </p>
          </div>
          <div className={styles.facilityGrid}>
            {(facilities.length > 0 ? facilities : defaultFacilities).map((facility, index) => (
              <div key={facility.slug || index} className={styles.facilityCard}>
                <div className={styles.facilityImageWrapper}>
                  {facility.images && Array.isArray(facility.images) && facility.images[0] ? (
                    <img
                      src={facility.images[0]}
                      alt={facility.name}
                      className={styles.facilityImageReal}
                    />
                  ) : (
                    <div className={styles.facilityImage} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)' }}>
                      <FacilityIcon type={facility.type || facility.facilityType} size={48} />
                    </div>
                  )}
                  <div className={styles.facilityBadge} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FacilityIcon type={facility.type || facility.facilityType} size={14} />
                    <span>
                      {facility.type === 'AULA' || facility.facilityType === 'AULA'
                        ? 'Aula'
                        : facility.type === 'GOR' || facility.facilityType === 'GOR'
                          ? 'GOR'
                          : facility.type === 'LAPANGAN' || facility.facilityType === 'LAPANGAN'
                            ? 'Lapangan'
                            : 'Gedung'}
                    </span>
                  </div>
                </div>
                <div className={styles.facilityBody}>
                  <h3 className={styles.facilityName}>{facility.name}</h3>
                  <p className={styles.facilityLocation} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} />
                    {facility.location}
                  </p>
                  <div className={styles.facilityMeta}>
                    <span className={styles.facilityCapacity} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} style={{ color: 'var(--text-secondary)' }} />
                      {facility.capacity} orang
                    </span>
                    <span className={styles.facilityPrice}>
                      {facility.pricePerHour > 0
                        ? `Rp ${(facility.pricePerHour).toLocaleString('id-ID')}/jam`
                        : 'Gratis'}
                    </span>
                  </div>
                  <p className={styles.facilityDesc}>
                    {(facility.description || '').slice(0, 120)}...
                  </p>
                </div>
                <div className={styles.facilityFooter}>
                  <Link href={`/facilities/${facility.slug}`} className={styles.facilityBtn}>
                    Lihat Detail & Booking →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className={styles.howItWorks}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Cara Booking</span>
            <h2 className={styles.sectionTitle}>4 Langkah Mudah</h2>
            <p className={styles.sectionSubtitle}>
              Proses booking yang simpel dan transparan
            </p>
          </div>
          <div className={styles.stepsGrid}>
            {[
              {
                step: '01',
                icon: KeyRound,
                title: 'Daftar & Login',
                desc: 'Buat akun dengan email kampus atau sebagai pihak eksternal',
              },
              {
                step: '02',
                icon: Calendar,
                title: 'Pilih & Cek Jadwal',
                desc: 'Pilih fasilitas, lihat kalender ketersediaan, dan tentukan waktu',
              },
              {
                step: '03',
                icon: CheckCircle,
                title: 'Submit & Tunggu',
                desc: 'Ajukan booking dan tunggu persetujuan admin kampus',
              },
              {
                step: '04',
                icon: Smartphone,
                title: 'QR Code & Gunakan',
                desc: 'Setelah disetujui, dapatkan QR Code akses di dashboard untuk check-in langsung di lokasi fasilitas',
              },
            ].map((item) => (
              <div key={item.step} className={styles.stepCard}>
                <div className={styles.stepNumber}>{item.step}</div>
                <div className={styles.stepIcon} style={{ display: 'flex', justifyContent: 'center', color: 'var(--primary-600)' }}>
                  <item.icon size={36} />
                </div>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.stepDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="stats" className={styles.features}>
        <div className={styles.sectionContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionLabel}>Mengapa Kami?</span>
            <h2 className={styles.sectionTitle}>Fitur Unggulan</h2>
          </div>
          <div className={styles.featuresGrid}>
            {[
              { icon: RefreshCw, title: 'Deteksi Bentrok Otomatis', desc: 'Sistem otomatis mendeteksi jadwal yang bertabrakan' },
              { icon: CreditCard, title: 'Pembayaran Online', desc: 'Bayar via QRIS, bank transfer, dan e-wallet' },
              { icon: Smartphone, title: 'QR Code Verifikasi', desc: 'Verifikasi penggunaan fasilitas dengan scan QR' },
              { icon: Bell, title: 'Reminder Otomatis', desc: 'Notifikasi sebelum jadwal kegiatan berlangsung' },
              { icon: BarChart3, title: 'Laporan Lengkap', desc: 'Dashboard statistik dan laporan penggunaan' },
              { icon: GraduationCap, title: 'Gratis Mahasiswa', desc: 'Booking gratis untuk seluruh civitas akademika' },
            ].map((feature) => (
              <div key={feature.title} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ color: 'var(--primary-600)' }}>
                  <feature.icon size={28} />
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Siap Booking Fasilitas Kampus?</h2>
          <p className={styles.ctaSubtitle}>
            Daftar sekarang dan nikmati kemudahan booking fasilitas kampus secara online
          </p>
          <div className={styles.ctaButtons}>
            <Link href="/register" className={styles.ctaPrimaryBtn}>
              Daftar Sekarang — Gratis
            </Link>
            <Link href="/login" className={styles.ctaSecondaryBtn}>
              Sudah Punya Akun? Masuk
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <img src="/logo-uir.png" alt="Logo UIR" width={24} height={24} style={{ objectFit: 'contain' }} />
              <span>BookingKampus</span>
            </div>
            <p className={styles.footerDesc}>
              Sistem booking fasilitas kampus online yang mudah, cepat, dan transparan.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerColumn}>
              <h4>Navigasi</h4>
              <Link href="#facilities">Fasilitas</Link>
              <Link href="#how-it-works">Cara Booking</Link>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </div>
            <div className={styles.footerColumn}>
              <h4>Kontak</h4>
              <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} style={{ color: 'var(--primary-400)', marginTop: '2px', flexShrink: 0 }} />
                <span>
                  Jl. Kaharuddin Nasution 113,<br />
                  Pekanbaru 28284<br />
                  Riau - Indonesia
                </span>
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                info@uir.ac.id
              </p>
              <p style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <Phone size={16} style={{ color: 'var(--primary-400)', marginTop: '2px', flexShrink: 0 }} />
                <span>
                  Telepon ke +62 761 674674<br />
                  atau WhatsApp di +62 811-777-1962
                </span>
              </p>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2025 Booking Fasilitas Kampus. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}



const defaultFacilities = [
  {
    name: 'Aula Rektorat', slug: 'aula-rektorat', facilityType: 'AULA',
    description: 'Aula utama Rektorat dengan kapasitas besar, dilengkapi sound system profesional, AC sentral, dan panggung permanen.',
    capacity: 500, location: 'Gedung Rektorat Lantai 1', pricePerHour: 500000,
    images: ['/facilities/aula-rektorat.jpg'],
  },
  {
    name: 'Aula Pasca Sarjana', slug: 'aula-pasca-sarjana', facilityType: 'AULA',
    description: 'Aula modern di Gedung Pascasarjana dengan desain kontemporer dan fasilitas multimedia canggih.',
    capacity: 200, location: 'Gedung Pascasarjana Lantai 3', pricePerHour: 350000,
    images: ['/facilities/aula-pasca.jpg'],
  },
  {
    name: 'GOR Volly', slug: 'gor-volly', facilityType: 'GOR',
    description: 'Gelanggang Olahraga indoor khusus voli dengan lapangan standar nasional and tribun penonton.',
    capacity: 300, location: 'Kompleks Olahraga Kampus', pricePerHour: 200000,
    images: ['/facilities/gor-volly.jpg'],
  },
  {
    name: 'Lapangan Panahan', slug: 'lapangan-panahan', facilityType: 'LAPANGAN',
    description: 'Lapangan panahan outdoor dengan 10 jalur target standar internasional.',
    capacity: 50, location: 'Area Outdoor Kampus Timur', pricePerHour: 150000,
    images: ['/facilities/lapangan-panahan.jpg'],
  },
  {
    name: 'Lapangan Bola', slug: 'lapangan-bola', facilityType: 'LAPANGAN',
    description: 'Lapangan sepak bola berumput sintetis standar FIFA dengan pencahayaan malam hari.',
    capacity: 1000, location: 'Stadion Mini Kampus', pricePerHour: 300000,
    images: ['/facilities/lapangan-bola.jpg'],
  },
  {
    name: 'Gedung PKM', slug: 'gedung-pkm', facilityType: 'GEDUNG',
    description: 'Gedung Pusat Kegiatan Mahasiswa (PKM) sebagai pusat aktivitas kemahasiswaan.',
    capacity: 150, location: 'Area Kemahasiswaan Kampus', pricePerHour: 100000,
    images: ['/facilities/gedung-pkm.jpg'],
  },
]
