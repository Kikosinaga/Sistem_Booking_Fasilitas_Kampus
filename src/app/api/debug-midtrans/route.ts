import { NextResponse } from 'next/server'
import { coreApi } from '@/lib/midtrans'

export const dynamic = 'force-dynamic'

export async function GET() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION
  
  const keyType = serverKey.startsWith('SB-') ? 'Sandbox' : (serverKey ? 'Production' : 'Not Set')
  const maskedKey = serverKey ? `${serverKey.slice(0, 8)}...${serverKey.slice(-4)}` : 'none'
  
  let pingResult = ''
  try {
    // Try to check status of a random order to test authentication
    await coreApi.transaction.status('TEST-RANDOM-ID-123')
    pingResult = 'Connected'
  } catch (err: any) {
    const apiResponse = err.ApiResponse || err.rawHttpClientData?.data
    pingResult = `Status code: ${err.httpStatusCode || err.statusCode || 'unknown'}. Message: ${err.message}. Response: ${JSON.stringify(apiResponse || '')}`
  }

  return NextResponse.json({
    MIDTRANS_IS_PRODUCTION: isProduction,
    keyType,
    maskedKey,
    hasClientKey: !!clientKey,
    pingResult
  })
}
