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
      // Headers globales para todas las rutas
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
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Headers adicionales para APIs
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
          {
            key: "X-API-Version",
            value: "1.0.0",
          },
        ],
      },
      // Headers para streaming de video (permitir cache)
      {
        source: "/api/videos/stream/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, max-age=3600",
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

  // NOTA: Las opciones eslint y typescript.ignoreBuildErrors 
  // deben configurarse en package.json o eliminarse en producción
};

export default nextConfig;
