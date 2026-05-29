/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  env: {
    // Embedded at build time so the client can append `?v=<ts>` to data.json
    // and bust any stale browser cache from prior deploys.
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    // Exposed to client so data-fetch can construct an absolute path that
    // works from any sub-route (e.g. /about/) regardless of basePath.
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};
export default nextConfig;
