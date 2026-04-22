import type { NextConfig } from "next";

const replitDevDomain = process.env.REPLIT_DEV_DOMAIN;

const nextConfig: NextConfig = {
  ...(replitDevDomain && {
    allowedDevOrigins: [replitDevDomain],
  }),
};

export default nextConfig;
