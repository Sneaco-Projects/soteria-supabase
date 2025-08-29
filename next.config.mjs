/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generate a fully static site in ./out
  output: 'export',

  // Since you're on Firebase Hosting and not using Next's Image Optimization
  images: { unoptimized: true },

  // These are fine for now (CI will not block on lint/types)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
