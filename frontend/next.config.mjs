/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
    ],
  },
  allowedDevOrigins: ['192.168.1.124', '192.168.1.124:3000', 'localhost:3000'],
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const cleanApiUrl = apiUrl.replace(/\/$/, '');
    const destinationUrl = cleanApiUrl.endsWith('/api')
      ? `${cleanApiUrl}/:path*`
      : `${cleanApiUrl}/api/:path*`;

    return [
      {
        source: '/api/:path*',
        destination: destinationUrl,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
