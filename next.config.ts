import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without it, Turbopack can pick a
  // stray package-lock.json higher up the tree (e.g. in the home directory).
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
