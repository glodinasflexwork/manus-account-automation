/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer', '@sparticuz/chromium'],
  webpack: (config) => {
    config.externals = [...(config.externals || []), 'puppeteer'];
    return config;
  },
}

module.exports = nextConfig

