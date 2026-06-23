'use server'

import { prisma } from '@/lib/prisma'
import { signIn } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function registerUser(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const role = formData.get('role') as string
  const nim = (formData.get('nim') || formData.get('npm')) as string | null
  const nip = formData.get('nip') as string | null
  const phone = formData.get('phone') as string | null
  const organization = formData.get('organization') as string | null

  // Validation
  if (!name || !email || !password || !role) {
    return { error: 'Semua field wajib harus diisi' }
  }

  if (password.length < 6) {
    return { error: 'Password minimal 6 karakter' }
  }

  if (password !== confirmPassword) {
    return { error: 'Password dan konfirmasi password tidak cocok' }
  }

  if (role === 'MAHASISWA' && !nim) {
    return { error: 'NPM wajib diisi untuk mahasiswa' }
  }

  if (role === 'DOSEN' && !nip) {
    return { error: 'NIP wajib diisi untuk dosen' }
  }

  if (role === 'EKSTERNAL' && !organization) {
    return { error: 'Nama organisasi/perusahaan wajib diisi untuk eksternal' }
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: 'Email sudah terdaftar' }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
        nim,
        nip,
        phone,
        organization,
      },
    })

    return { success: 'Akun berhasil dibuat! Silakan login.' }
  } catch (error) {
    return { error: 'Gagal membuat akun. Silakan coba lagi.' }
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email dan password harus diisi' }
  }

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    // Get user role for redirect
    const user = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    })

    if (user?.role === 'ADMIN') {
      return { success: true, redirectTo: '/admin/dashboard' }
    }
    return { success: true, redirectTo: '/dashboard' }
  } catch (error: any) {
    if (error?.type === 'CredentialsSignin') {
      return { error: 'Email atau password salah' }
    }
    return { error: 'Email atau password salah' }
  }
}
