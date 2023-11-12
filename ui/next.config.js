/** @type {import('next').NextConfig} */

console.log('env', process.env.NODE_ENV)
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  basePath: '/aketemite',
  images: {
    unoptimized: true
  },
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NODE_ENV === 'production'
        ? '/aketemite/api'
        : 'http://localhost:3001/aketemite/api'
  }
}

module.exports = nextConfig
