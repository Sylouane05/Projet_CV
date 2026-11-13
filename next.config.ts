import type { NextConfig } from "next";

const staticHosting = process.env.CV_STATIC_HOSTING === "1";
const nextConfig: NextConfig = {
  ...(staticHosting ? { output: "export", trailingSlash: true, images: { unoptimized: true } } : {}),
  env: { NEXT_PUBLIC_AI_ENABLED: staticHosting ? "false" : process.env.NEXT_PUBLIC_AI_ENABLED ?? "true" },
};

export default nextConfig;

