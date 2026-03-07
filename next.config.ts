import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    outputFileTracingRoot: process.cwd(),
    experimental: {
        isolatedDevBuild: true,
    },
};

export default nextConfig;
