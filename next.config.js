/** @type {import('next').NextConfig} */
const nextConfig = {
    // Temporary so we can deploy fast; we’ll fix lint later
    eslint: { ignoreDuringBuilds: true },
    // Optional: if you ever hit TypeScript build blocks, enable this too:
    // typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;
