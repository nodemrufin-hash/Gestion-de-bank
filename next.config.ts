import type { NextConfig } from "next";

/**
 * En développement, `/api/*` est redirigé vers le serveur Express local.
 * En production, le frontend et l'API sont déployés séparément : l'URL de l'API
 * vient de `NEXT_PUBLIC_API_URL` (voir `src/lib/api.ts`), et cette réécriture
 * vers localhost n'aurait aucun sens.
 */
const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV === "production") return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
