import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components — enables "use cache" + cacheLife + cacheTag
  // and the instant-navigation validation in dev
  cacheComponents: true,

  partialPrefetching: true,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },

  experimental: {
    // Downgrade instant-navigation validation from error to warning.
    // The warning will still appear in dev console but won't fail builds.
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
};

export default nextConfig;
