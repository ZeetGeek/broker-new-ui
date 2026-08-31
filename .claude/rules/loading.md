---
paths:
  - "app/**/*.{ts,tsx}"
  - "components/**/*.{ts,tsx}"
  - "features/**/*.{ts,tsx}"
---

# Loading states

Read `docs/LOADING.md` before building any screen that fetches data or submits
a form. It is the authority on skeletons, spinners, progress, and message copy.

Pick by duration:

```
< 100ms      → nothing (a flashing spinner reads as a glitch)
100ms – 1s   → skeleton, or inline spinner on the control
1s – 5s      → skeleton + a message naming what is loading
> 5s         → add reassurance: "Still working…"
measurable   → real progress bar with numbers (uploads)
```

Six rules restated because they are the ones that make an app feel broken:

1. **Every route that fetches data needs a `loading.tsx`.** It is a Server
   Component by default — zero client JS — and Next prefetches the fallback so
   navigation feels instant.
2. **Skeletons must match the real layout exactly.** Wrong dimensions cause the
   layout jump you were trying to prevent.
3. **Never replace visible content with a spinner.** Filter changes dim the
   list; they do not wipe the screen.
4. **Every button gets a pending state and is disabled while pending.** Keep
   the label — "Saving…", not a bare spinner.
5. **Four states, not one:** loading, empty, error, success. Empty must teach
   the next action, never say "No data".
6. **Messages name the object.** "Finding properties near you…", not
   "Loading". Never show a status code or stack trace to a user.

Assume a cheap Android phone on congested 4G. A blank screen for two seconds
does not read as slow to a non-technical user — it reads as broken.

Everything else — the `<Suspense>` `key` gotcha, `useActionState` /
`useOptimistic`, upload progress requirements, copy tables, timeouts, offline,
accessibility — is in `docs/LOADING.md`.
