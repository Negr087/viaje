/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Permite compilar en otra carpeta sin pisar la de `next dev` (NEXT_DIST_DIR=.next-check npm run build)
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
