import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// Allowed types per document type
const ALLOWED_TYPES_BY_DOC: Record<string, string[]> = {
  KTM: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  PROPOSAL: ['application/pdf'],
  PAYMENT_PROOF: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
  OTHER: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
}

const FRIENDLY_LABELS: Record<string, string> = {
  KTM: 'JPG, PNG, atau PDF',
  PROPOSAL: 'PDF',
  PAYMENT_PROOF: 'JPG, PNG, WebP, atau PDF',
  OTHER: 'JPG, PNG, WebP, atau PDF',
}

const UPLOAD_PREFIXES: Record<string, string> = {
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

    // Validate file type based on document type
    const allowedTypes = ALLOWED_TYPES_BY_DOC[documentType] || ALLOWED_TYPES_BY_DOC.OTHER
    const friendlyLabel = FRIENDLY_LABELS[documentType] || FRIENDLY_LABELS.OTHER

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Format file tidak didukung. Gunakan ${friendlyLabel}.` },
        { status: 400 }
      )
    }

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    }
    const ext = extMap[file.type] || '.bin'
    const prefix = UPLOAD_PREFIXES[documentType] || 'others'
    const uniqueName = `${prefix}/${uuidv4()}${ext}`

    // Upload to Vercel Blob
    const blob = await put(uniqueName, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileUrl: blob.url,
      fileSize: file.size,
      mimeType: file.type,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupload file. Pastikan konfigurasi storage sudah benar.' },
      { status: 500 }
    )
  }
}
