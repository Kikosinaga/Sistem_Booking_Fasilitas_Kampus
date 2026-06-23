import dotenv from 'dotenv'
dotenv.config()

import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const sslConfig = process.env.DB_SSL === 'true'
  ? { rejectUnauthorized: true }
  : undefined

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'booking_kampus',
  connectionLimit: 5,
  ssl: sslConfig,
})
const prisma = new PrismaClient({ adapter })

async function check() {
  try {
    const users = await prisma.user.findMany()
    console.log('CONNECTED! Users in DB:', users.map(u => ({ id: u.id, email: u.email, role: u.role })))
  } catch (error) {
    console.error('ERROR CONNECTING:', error)
  } finally {
    await prisma.$disconnect()
  }
}

check()
