<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep category lists, local matching, and selection-resolution rules in the browser-safe categorization utility so forms and tests share one source of truth.
- Accept legacy expense and income labels when editing historical transactions, but offer current grouped labels for new transactions, to preserve saved data without schema migrations.
- Share one category picker between Add and Edit, driven by the browser-safe category groups, to keep options and historical compatibility consistent.
- Handle identity transitions once in the root auth subscriber, cancelling requests and clearing private query data before revalidating the managed route gate, so expired or switched sessions cannot reuse cached finances.
- Validate transaction writes with strict browser-safe schemas and database constraints; keep owner-scoped RLS as the authority, so bypassing forms cannot bypass data protection.
- Encode every CSV cell with formula neutralization and apply baseline security/no-store headers centrally to server responses, so all exports and pages share the safeguards.
- Derive CSP backend connections from the browser's configured public URL; permit only trusted Lovable editor framing on preview hosts and deny production framing, so security headers do not block app loading.
- Publish builds run from a git snapshot without `.env`, so `vite.config.ts` defines `import.meta.env.VITE_SUPABASE_*` with publishable fallback values (process.env → .env → fallback); never remove these defines or the published bundle loses its backend URL ("supabaseUrl is required").
