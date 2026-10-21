import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is on: data fetching is dynamic by default, and
  // prerendered pages must produce a non-empty static shell.
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
  // pg's socket/TLS stack breaks when bundled — always require() it at runtime.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
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
