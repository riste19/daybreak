// React's <ViewTransition> ships in the canary channel that Next.js's App Router
// runs on (Next bundles it; see node_modules/next/dist/compiled/react). The stable
// @types/react only declares it under react/canary, so pull those types in once,
// project-wide, to make `import { ViewTransition } from "react"` type-check.
/// <reference types="react/canary" />
