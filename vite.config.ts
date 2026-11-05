// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// The publish build runs from a git snapshot where .env (gitignored) is absent,
// so the base config's loadEnv finds nothing and the client bundle ships without
// backend settings ("supabaseUrl is required" on the published site). These are
// publishable (public) values — safe to embed in client code — and are used only
// as a last-resort fallback when neither process.env nor a local .env provides them.
const fileEnv = loadEnv("production", process.cwd(), "VITE_");
function publicBackendValue(key: string, fallback: string): string {
  return process.env[key] ?? fileEnv[key] ?? fallback;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
        publicBackendValue("VITE_SUPABASE_URL", "https://c--d05b457c-1582-406a-ad93-7c7d5441351b-prod.lovable.cloud"),
      ),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
        publicBackendValue("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_go_gXCdQv1l4NZL5Nq1RSQ_22tY7NnO"),
      ),
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(
        publicBackendValue("VITE_SUPABASE_PROJECT_ID", "ujtcdoupbwbybyrwyhic"),
      ),
    },
  },
});
