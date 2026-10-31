/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Turbopack's workspace root anchored to this app, even if a lockfile
  // exists in a parent folder such as the Windows user directory.
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
