import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: '/:path*',
        headers: [
          // Previene que la página se muestre en iframes (previene clickjacking)
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Previene ataques XSS reflejados
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Previene que el navegador infiera el tipo de contenido (previene MIME sniffing)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Política de Referrer para privacidad
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permisos del navegador (restringe características como cámara, micrófono, etc.)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Headers para APIs
        source: '/api/:path*',
        headers: [
          // Control de quién puede acceder a la API
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
          },
          // Métodos HTTP permitidos
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          // Headers permitidos
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, Cookie',
          },
          // Permite enviar cookies
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
