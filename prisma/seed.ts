// Load env FIRST before anything else
import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import bcrypt from 'bcryptjs'

const getEnv = (key: string, defaultValue: string = '') => {
  const val = process.env[key]
  if (!val) return defaultValue
  return val.replace(/['"]/g, '')
}

const dbHost = getEnv('DB_HOST', 'localhost')
const dbPort = Number(getEnv('DB_PORT', '3306'))
const dbUser = getEnv('DB_USER', 'root')
const dbPassword = getEnv('DB_PASSWORD', '')
const dbName = getEnv('DB_NAME', 'booking_kampus')
const dbSsl = getEnv('DB_SSL', '')

const sslConfig = dbSsl === 'true'
  ? { rejectUnauthorized: false }
  : undefined

const adapter = new PrismaMariaDb({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  connectionLimit: 5,
  ssl: sslConfig,
  connectTimeout: 15000,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data
  await prisma.notification.deleteMany()
  await prisma.qRVerification.deleteMany()
  await prisma.document.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.facility.deleteMany()
  await prisma.user.deleteMany()

  // Create Admin
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Kampus',
      email: 'admin@kampus.ac.id',
      password: adminPassword,
      role: 'ADMIN',
      phone: '081234567890',
      isActive: true,
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Create Mahasiswa
  const mhsPassword = await bcrypt.hash('mahasiswa123', 12)
  const mahasiswa = await prisma.user.create({
    data: {
      name: 'Ahmad Fajar',
      email: 'ahmad@student.kampus.ac.id',
      password: mhsPassword,
      role: 'MAHASISWA',
      nim: '2024001001',
      phone: '081234567891',
      organization: 'BEM Fakultas Teknik',
      isActive: true,
    },
  })
  console.log('✅ Mahasiswa created:', mahasiswa.email)

  // Create Dosen
  const dosenPassword = await bcrypt.hash('dosen123', 12)
  const dosen = await prisma.user.create({
    data: {
      name: 'Dr. Siti Nurhaliza',
      email: 'siti@kampus.ac.id',
      password: dosenPassword,
      role: 'DOSEN',
      nip: '198501012010012001',
      phone: '081234567892',
      isActive: true,
    },
  })
  console.log('✅ Dosen created:', dosen.email)

  // Create Eksternal
  const eksternalPassword = await bcrypt.hash('eksternal123', 12)
  const eksternal = await prisma.user.create({
    data: {
      name: 'PT. Maju Bersama',
      email: 'booking@majubersama.co.id',
      password: eksternalPassword,
      role: 'EKSTERNAL',
      phone: '081234567893',
      organization: 'PT. Maju Bersama',
      isActive: true,
    },
  })
  console.log('✅ Eksternal created:', eksternal.email)

  // Create Facilities
  const facilities = await Promise.all([
    prisma.facility.create({
      data: {
        name: 'Aula Rektorat',
        slug: 'aula-rektorat',
        type: 'AULA',
        description:
          'Aula utama Rektorat dengan kapasitas besar, dilengkapi sound system profesional, AC sentral, dan panggung permanen. Cocok untuk acara resmi universitas, wisuda, seminar nasional, dan kegiatan berskala besar lainnya.',
        capacity: 500,
        location: 'Gedung Rektorat Lantai 1',
        images: ['/facilities/aula-rektorat.jpg'],
        pricePerHour: 500000,
        amenities: [
          'Sound System',
          'Projector & Layar',
          'AC Sentral',
          'Panggung',
          'WiFi',
          'Parkir Luas',
          'Kursi 500 unit',
          'Podium',
        ],
        rules:
          'Tidak diperkenankan membawa makanan berat ke dalam aula. Harus menjaga kebersihan. Waktu penggunaan sesuai jadwal yang disetujui.',
        openTime: '07:00',
        closeTime: '22:00',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Aula Pasca Sarjana',
        slug: 'aula-pasca-sarjana',
        type: 'AULA',
        description:
          'Aula modern di Gedung Pascasarjana dengan desain kontemporer. Dilengkapi fasilitas multimedia canggih, ideal untuk seminar, workshop, sidang terbuka, dan kegiatan akademik tingkat pascasarjana.',
        capacity: 200,
        location: 'Gedung Pascasarjana Lantai 3',
        images: ['/facilities/aula-pasca.jpg'],
        pricePerHour: 350000,
        amenities: [
          'Sound System',
          'Projector HD',
          'AC',
          'WiFi High-Speed',
          'Kursi 200 unit',
          'Meja Presidium',
          'Backdrop',
        ],
        rules:
          'Menjaga ketenangan area sekitar. Mengembalikan fasilitas ke posisi semula setelah selesai digunakan.',
        openTime: '08:00',
        closeTime: '21:00',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'GOR Volly',
        slug: 'gor-volly',
        type: 'GOR',
        description:
          'Gelanggang Olahraga indoor khusus voli dengan lapangan standar nasional. Dilengkapi tribun penonton, ruang ganti, dan pencahayaan standar pertandingan. Cocok untuk latihan rutin, pertandingan, dan turnamen.',
        capacity: 300,
        location: 'Kompleks Olahraga Kampus',
        images: ['/facilities/gor-volly.jpg'],
        pricePerHour: 200000,
        amenities: [
          'Lapangan Standar',
          'Net Voli',
          'Bola Voli',
          'Tribun 300 kursi',
          'Ruang Ganti',
          'Toilet',
          'Pencahayaan LED',
          'P3K',
        ],
        rules:
          'Wajib menggunakan sepatu olahraga. Tidak diperkenankan membawa makanan ke area lapangan. Menjaga kebersihan dan ketertiban.',
        openTime: '06:00',
        closeTime: '22:00',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Lapangan Panahan',
        slug: 'lapangan-panahan',
        type: 'LAPANGAN',
        description:
          'Lapangan panahan outdoor dengan 10 jalur target standar internasional. Dilengkapi safety net, target board, dan area istirahat. Cocok untuk latihan UKM panahan, kompetisi, dan kegiatan outdoor.',
        capacity: 50,
        location: 'Area Outdoor Kampus Timur',
        images: ['/facilities/lapangan-panahan.jpg'],
        pricePerHour: 150000,
        amenities: [
          '10 Jalur Target',
          'Safety Net',
          'Target Board',
          'Gazebo Istirahat',
          'P3K',
          'Toilet',
          'Parkir',
        ],
        rules:
          'Wajib didampingi pelatih bersertifikat. Menggunakan alat pelindung diri. Tidak diperkenankan mengarahkan busur ke area selain target.',
        openTime: '06:00',
        closeTime: '18:00',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Lapangan Bola',
        slug: 'lapangan-bola',
        type: 'LAPANGAN',
        description:
          'Lapangan sepak bola berumput sintetis standar FIFA dengan pencahayaan malam hari. Dilengkapi tribun penonton, ruang ganti, dan fasilitas pendukung pertandingan resmi.',
        capacity: 1000,
        location: 'Stadion Mini Kampus',
        images: ['/facilities/lapangan-bola.jpg'],
        pricePerHour: 300000,
        amenities: [
          'Rumput Sintetis FIFA',
          'Lampu Sorot',
          'Tribun 1000 kursi',
          'Ruang Ganti',
          'Gawang Standar',
          'Bola Sepak',
          'Toilet',
          'Parkir Luas',
        ],
        rules:
          'Wajib menggunakan sepatu sepak bola. Tidak diperkenankan membawa hewan peliharaan. Menjaga fasilitas yang tersedia.',
        openTime: '06:00',
        closeTime: '22:00',
      },
    }),
    prisma.facility.create({
      data: {
        name: 'Gedung PKM',
        slug: 'gedung-pkm',
        type: 'GEDUNG',
        description:
          'Gedung Pusat Kegiatan Mahasiswa (PKM) sebagai pusat aktivitas kemahasiswaan. Terdiri dari beberapa ruangan serbaguna yang bisa disekat, cocok untuk rapat organisasi, workshop, bazaar, dan kegiatan mahasiswa.',
        capacity: 150,
        location: 'Area Kemahasiswaan Kampus',
        images: ['/facilities/gedung-pkm.jpg'],
        pricePerHour: 100000,
        amenities: [
          'Ruang Serbaguna',
          'Meja & Kursi',
          'Projector',
          'AC',
          'WiFi',
          'Pantry',
          'Toilet',
          'Musholla',
        ],
        rules:
          'Menjaga kebersihan dan ketertiban. Mengembalikan penataan ruangan seperti semula. Tidak diperkenankan menempelkan dekorasi permanen.',
        openTime: '07:00',
        closeTime: '22:00',
      },
    }),
  ])

  console.log(`✅ ${facilities.length} Facilities created`)

  // Create sample bookings
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(12, 0, 0, 0)

  const nextWeek = new Date(now)
  nextWeek.setDate(nextWeek.getDate() + 7)
  nextWeek.setHours(13, 0, 0, 0)

  const nextWeekEnd = new Date(nextWeek)
  nextWeekEnd.setHours(17, 0, 0, 0)

  const booking1 = await prisma.booking.create({
    data: {
      userId: mahasiswa.id,
      facilityId: facilities[0].id, // Aula Rektorat
      title: 'Seminar Nasional Teknologi Informasi',
      description: 'Seminar nasional dengan tema AI dan Machine Learning untuk mahasiswa dan umum.',
      organization: 'BEM Fakultas Teknik',
      startTime: tomorrow,
      endTime: tomorrowEnd,
      attendees: 300,
      status: 'APPROVED',
      totalPrice: 0,
      paymentStatus: 'PAID',
      isFree: true,
    },
  })

  const booking2 = await prisma.booking.create({
    data: {
      userId: eksternal.id,
      facilityId: facilities[4].id, // Lapangan Bola
      title: 'Turnamen Sepak Bola Antar Perusahaan',
      description: 'Turnamen sepak bola tahunan antar perusahaan se-kota.',
      organization: 'PT. Maju Bersama',
      startTime: nextWeek,
      endTime: nextWeekEnd,
      attendees: 200,
      status: 'PENDING',
      totalPrice: 1200000,
      paymentStatus: 'UNPAID',
      isFree: false,
    },
  })

  console.log('✅ Sample bookings created')



  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: mahasiswa.id,
        title: 'Booking Disetujui',
        message: `Booking "${booking1.title}" di Aula Rektorat telah disetujui oleh admin.`,
        type: 'BOOKING_APPROVED',
        bookingId: booking1.id,
      },
      {
        userId: eksternal.id,
        title: 'Booking Diajukan',
        message: `Booking "${booking2.title}" di Lapangan Bola sedang menunggu persetujuan admin.`,
        type: 'BOOKING_SUBMITTED',
        bookingId: booking2.id,
      },
      {
        userId: admin.id,
        title: 'Booking Baru',
        message: `Ada booking baru dari PT. Maju Bersama untuk Lapangan Bola.`,
        type: 'BOOKING_SUBMITTED',
        bookingId: booking2.id,
      },
    ],
  })
  console.log('✅ Notifications created')

  console.log('\n🎉 Database seeding completed!')
  console.log('\n📋 Akun yang tersedia:')
  console.log('  Admin    : admin@kampus.ac.id / admin123')
  console.log('  Mahasiswa: ahmad@student.kampus.ac.id / mahasiswa123')
  console.log('  Dosen    : siti@kampus.ac.id / dosen123')
  console.log('  Eksternal: booking@majubersama.co.id / eksternal123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
