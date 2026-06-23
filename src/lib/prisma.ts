import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
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
    ? { rejectUnauthorized: true }
    : undefined

  console.log('[Prisma Init] Connecting to Host:', dbHost, '| Port:', dbPort, '| User:', dbUser, '| DB:', dbName, '| SSL:', !!sslConfig)

  const adapter = new PrismaMariaDb({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    connectionLimit: 5,
    ssl: sslConfig,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
