import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // better-sqlite3 is a native database driver, so Next.js must not bundle it.
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      // Create IDP allows up to 10 photos of 5 MB each.
      bodySizeLimit: "55mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
