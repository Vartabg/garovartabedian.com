import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    // `**/` matters: agent worktrees under .claude/ carry their own .next
    // build output, and a bare `.next/**` only ignores the one at the root —
    // so a stray worktree turns `npm run lint` into hundreds of errors in
    // generated vendor chunks. Both paths are gitignored, so CI never saw it.
    ignores: [
      "**/.next/**",
      "**/.vercel/**",
      "**/node_modules/**",
      ".claude/**",
      // Vendored onnxruntime-web loader served for the in-browser semantic search.
      "public/ort/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
