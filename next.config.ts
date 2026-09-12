import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        formats: ["image/avif", "image/webp"],
        qualities: [60, 75, 80, 85, 90],
        deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1440, 1920],
        imageSizes: [32, 40, 48, 64, 72, 88, 96, 120, 144, 180, 240, 320],
        minimumCacheTTL: 86_400,
        maximumRedirects: 2,
        contentDispositionType: "attachment",
        contentSecurityPolicy: "script-src 'none'; frame-src 'none'; sandbox;",
        remotePatterns: [
            {
                protocol: "https",
                hostname: "images.unsplash.com",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
            },
            {
                protocol: "https",
                hostname: "**.r2.dev",
            },
            ...(process.env.NODE_ENV === "production"
                ? []
                : ([
                      { protocol: "https", hostname: "localhost" },
                      { protocol: "http", hostname: "localhost" },
                  ] as const)),
        ],
    },
};

export default nextConfig;
