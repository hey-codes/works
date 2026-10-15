import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // next dev would otherwise write an AGENTS.md at the root on every run (the old one is in archive/).
  agentRules: false,
  reactStrictMode: true,
};

export default nextConfig;
