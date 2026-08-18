---
paths:
  - "app/**/*.{ts,tsx}"
---

# Working under `app/`

Read `app/AGENTS.md` before changing this file. It is the authority on SEO,
metadata, and indexing for every route.

Two things that are expensive to get wrong, stated here so they are never
missed:

1. **Default is `noindex`.** Portal routes (`app/owner/**`, `app/broker/**`)
   and anything behind auth must never be indexable. They contain private
   client and contact data.
2. **Metadata must be server-rendered.** Crawlers read the HTML once and do
   not run React. Metadata set in a client component or `useEffect` is
   invisible to them.

Everything else — `metadataBase`, `generateMetadata`, OG images, JSON-LD,
semantic HTML, the pre-ship checklist — is in `app/AGENTS.md`. Go read it.
