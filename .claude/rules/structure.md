# Project structure

Read `docs/STRUCTURE.md` before creating any new file or folder. It is the
authority on where code lives.

No `paths:` frontmatter here on purpose — this rule must be loaded *before* a
file is created, not after one is opened.

Five rules restated because they are the ones that decay a codebase quietly:

1. **Dependencies flow one way:** `app/ → features/ → components/ → lib/`.
   An upward import is always a design mistake.
2. **`app/` is routing only.** A `page.tsx` fetches, composes, returns. Form
   logic, filter state, and large JSX trees belong in `features/`.
3. **`app/owner/` and `app/broker/` never import from each other.** Shared code
   goes in `features/`. Crossing that line is how one portal ships the other's
   data.
4. **Never edit `components/ui/`.** It is vendored shadcn. Wrap it in
   `components/shared/` instead so `npx shadcn add` stays safe.
5. **`lib/utils.ts` holds `cn()` and nothing else.** New helpers get named
   files — `lib/format/price.ts`, never another export in `utils.ts`.

Placement decision, short form:

```
Is it a URL?                      → app/
Route-specific, one route only?   → app/<route>/_components/
Belongs to one domain?            → features/<domain>/
Used by 3+ features?              → components/shared/
Pure function, no React?          → lib/
```

When unsure, put it in the feature. Promoting later is easy; untangling a
premature abstraction is not.

Everything else — route groups, the rule of three, barrel-file guidance, file
length limits, the `src/` decision — is in `docs/STRUCTURE.md`.
