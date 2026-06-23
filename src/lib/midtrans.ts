import midtransClient from 'midtrans-client'

// Create Snap API instance
export const snap = new midtransClient.Snap({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-dummy-key-1234',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dummy-key-1234'
})

// Create Core API instance (if needed for API checking)
export const coreApi = new midtransClient.CoreApi({
  isProduction: process.env.NODE_ENV === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-dummy-key-1234',
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dummy-key-1234'
})
