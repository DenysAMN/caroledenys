import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "fmkgkpsxzmgnhnsnspdp.supabase.co";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4.4mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/gallery-images/**" },
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/public/gift-images/**",
      },
    ],
  },
};

export default nextConfig;
