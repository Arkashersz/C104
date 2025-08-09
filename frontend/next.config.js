/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['dzyrmbvacyfnkqsuoula.supabase.co'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig