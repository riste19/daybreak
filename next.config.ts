import type { NextConfig } from "next";
import path from "node:path";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Treat .mdx as routes/pages so the blog content hub can author in MDX.
  pageExtensions: ["ts", "tsx", "mdx"],
  // Pin the workspace root to this project. Without it, Turbopack can pick a
  // stray package-lock.json higher up the tree (e.g. in the home directory).
  turbopack: {
    root: path.join(__dirname),
  },
  experimental: {
    // Enables React's <ViewTransition> integration so route navigations
    // (e.g. landing → /start) can animate. See app/page.tsx & app/start/page.tsx.
    viewTransition: true,
  },
  typescript: {
    // The sibling NestJS app (api/) is a SEPARATE, independently-deployed project
    // with its own tsconfig + dependencies. On Vercel it gets type-checked against
    // api/'s config WITHOUT api/'s installed deps (Vercel only installs the root),
    // which fails (e.g. global `Response` untyped). The Next frontend is still
    // fully type-checked locally via `pnpm build` (where tsconfig `exclude:
    // ["api"]` applies) and `.vercelignore` keeps api/ out of the Vercel build,
    // so skipping Next's build-time type gate here is safe. Revisit if api/ moves
    // to its own repo.
    ignoreBuildErrors: true,
  },
};

const withMDX = createMDX({
  options: {
    // Turbopack requires remark/rehype plugins as STRING names (it can't receive
    // JS function options across the Rust boundary) — see the Next MDX guide.
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-slug"],
  },
});

export default withMDX(nextConfig);
