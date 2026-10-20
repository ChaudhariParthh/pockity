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
