import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import type { NextAuthConfig } from 'next-auth'

// Auth config tanpa database imports — aman untuk Edge runtime (middleware)
export const authConfig: NextAuthConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    // Placeholder provider untuk middleware — actual authorize logic ada di auth.ts
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize() {
        // Actual authorize logic ada di auth.ts
        // Ini hanya placeholder agar middleware bisa baca session
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
}
