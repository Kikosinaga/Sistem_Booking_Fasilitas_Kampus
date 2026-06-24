import midtransClient from 'midtrans-client'

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'

// Create Snap API instance
export const snap = new midtransClient.Snap({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-dummy-key-1234',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dummy-key-1234'
})

// Create Core API instance (if needed for API checking)
export const coreApi = new midtransClient.CoreApi({
  isProduction,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-dummy-key-1234',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dummy-key-1234'
})

