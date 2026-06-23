'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ViewDocumentContent() {
  const searchParams = useSearchParams()
  const fileUrl = searchParams.get('file')
  const title = searchParams.get('title') || 'Pratinjau Dokumen'

  if (!fileUrl) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2 style={{ color: '#ef4444' }}>Dokumen Tidak Ditemukan</h2>
        <p style={{ color: '#64748b' }}>Tautan file tidak valid atau kosong.</p>
      </div>
    )
  }

  // Check if file is an image
  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fileUrl)

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh', 
      width: '100vw', 
      margin: 0, 
      padding: 0, 
      overflow: 'hidden', 
      backgroundColor: '#f1f5f9' 
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '0 20px', 
        backgroundColor: '#1e293b', 
        color: '#ffffff',
        height: '60px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        zIndex: 10
      }}>
        <h3 style={{ margin: 0, fontFamily: 'sans-serif', fontWeight: 600 }}>{title}</h3>
        <button 
          onClick={() => window.close()} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#ef4444', 
            color: '#ffffff', 
            borderRadius: '6px', 
            border: 'none',
            cursor: 'pointer', 
            fontWeight: '600',
            fontFamily: 'sans-serif',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
        >
          Tutup Pratinjau
        </button>
      </div>
      
      {/* Document Frame / Viewport */}
      <div style={{ width: '100%', height: 'calc(100vh - 60px)', position: 'relative' }}>
        {isImage ? (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            overflow: 'auto', 
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={fileUrl} 
              alt={title} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain', 
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
                borderRadius: '8px' 
              }} 
            />
          </div>
        ) : (
          <iframe 
            src={fileUrl} 
            width="100%" 
            height="100%" 
            style={{ border: 'none', display: 'block' }}
          />
        )}
      </div>
    </div>
  )
}

export default function ViewDocumentPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        Memuat dokumen...
      </div>
    }>
      <ViewDocumentContent />
    </Suspense>
  )
}
