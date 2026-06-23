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
  const dbPort = getEnv('DB_PORT', '3306')
  const dbUser = getEnv('DB_USER', 'root')
  const dbPassword = getEnv('DB_PASSWORD', '')
  const dbName = getEnv('DB_NAME', 'booking_kampus')
  const dbSsl = getEnv('DB_SSL', '')

  // Build connection string with connectTimeout embedded
  // The mariadb driver accepts a connection string and parses all parameters from it
  const sslParam = dbSsl === 'true' ? '&ssl=true' : ''
  const connectionString = `mariadb://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}?connectTimeout=30000&acquireTimeout=30000${sslParam}`

  console.log('[Prisma Init] Connecting to Host:', dbHost, '| Port:', dbPort, '| User:', dbUser, '| DB:', dbName, '| SSL:', dbSsl)

  const adapter = new PrismaMariaDb(connectionString)
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
