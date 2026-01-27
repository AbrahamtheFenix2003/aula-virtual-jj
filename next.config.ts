import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone para Docker
  output: "standalone",

  // Optimizaciones de imágenes
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  // Headers de seguridad
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },

  // Configuración experimental
  experimental: {
    // Optimización de server actions
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  // Ignorar errores de ESLint en build (opcional, quitar en producción)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Ignorar errores de TypeScript en build (opcional, quitar en producción)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
