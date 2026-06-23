import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'application/pdf',
]

const UPLOAD_DIRS: Record<string, string> = {
  KTM: 'ktm',
  PROPOSAL: 'proposals',
  PAYMENT_PROOF: 'payments',
  OTHER: 'others',
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentType = (formData.get('documentType') as string) || 'OTHER'

    if (!file) {
      return NextResponse.json(
        { error: 'File tidak ditemukan' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file maksimal 5MB' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.' },
        { status: 400 }
      )
    }

    // Create upload directory
    const subDir = UPLOAD_DIRS[documentType] || 'others'
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir)
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const ext = path.extname(file.name) || (file.type === 'application/pdf' ? '.pdf' : '.jpg')
    const uniqueName = `${uuidv4()}${ext}`
    const filePath = path.join(uploadDir, uniqueName)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return the public URL
    const fileUrl = `/uploads/${subDir}/${uniqueName}`

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupload file' },
      { status: 500 }
    )
  }
}
