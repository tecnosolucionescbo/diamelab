/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  // Excluir carpeta supabase/functions del build (usa Deno, no Node.js)
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/supabase/functions/**'],
    };
    return config;
  },
};
module.exports = nextConfig;
