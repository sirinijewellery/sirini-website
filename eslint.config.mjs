import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Standalone side-project 3D worlds (not part of the Next.js app) — ship
    // their own vendored, minified third-party libraries (e.g. three.js)
    // that aren't meant to pass this app's lint rules.
    "sirini-world/**",
    "sfj-world/**",
    // One-off Node/CJS maintenance scripts, already excluded from tsconfig's
    // type-checking — plain `require()` is intentional here, not an app-code
    // convention violation.
    "scripts/**",
  ]),
]);

export default eslintConfig;
