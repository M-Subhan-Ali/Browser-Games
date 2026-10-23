import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: builds to ./out as plain HTML/JS for Cloudflare Pages.
  output: "export",
  // No Next.js image optimization server in a static export.
  images: { unoptimized: true },
  // Emit /play/snake/index.html so Pages serves clean URLs without a server.
  trailingSlash: true,
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
