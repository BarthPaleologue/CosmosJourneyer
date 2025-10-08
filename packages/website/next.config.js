/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "export",
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
    // Remove experimental features that cause issues with static export
    experimental: {},
    compiler: {
        removeConsole: process.env.NODE_ENV === "production",
    },
    // Enable source maps in development
    productionBrowserSourceMaps: false,
    // Compress static files
    compress: true,
    // Note: Headers don't work with static export mode
    // If you need headers, deploy to a platform that supports them
};

module.exports = nextConfig;
