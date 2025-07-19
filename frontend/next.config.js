/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['https://dzyrmbvacyfnkqsuoula.supabase.co'],
  },
}

module.exports = nextConfig