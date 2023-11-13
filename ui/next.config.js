/** @type {import('next').NextConfig} */

const { version } = require('./package.json')
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
        : 'http://localhost:3001/aketemite/api',
    NEXT_PUBLIC_VERSION: version
  }
}

module.exports = nextConfig
