---
target: broker your-listings page
total_score: 21
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\app\\(role)\\broker\\your-listings\\page.tsx"
target_fingerprint: "sha256:0d0f7d51076927104c19594f8251e8e33b857474157177da307b14bb0d873ef7"
target_path: "D:\\Projects\\Office\\broker-new-ui\\app\\(role)\\broker\\your-listings\\page.tsx"
timestamp: 2026-10-20T07-15-18Z
slug: app-role-broker-your-listings-page-tsx
---

Method: dual-agent (A: 2b21f893-338b-4a03-b716-902de7283d09 · B: fd4d49ad-469d-40af-93a8-8f92c822833f)

Target: `app/(role)/broker/your-listings/page.tsx` → `features/properties/your-listings/*`
Mode: Operate · Evidence: source review + CLI detect (browser overlays unavailable)

## Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                             |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 2         | `Suspense fallback={null}`; no route `loading.tsx`; requests tab can blank-then-empty |
| 2         | Match System / Real World       | 2         | Owner-inventory language vs representation loop                                       |
| 3         | User Control and Freedom        | 3         | Clear filters, dismiss, gated remind                                                  |
| 4         | Consistency and Standards       | 2         | Orphan `?tab=requests`; naming Your/My/Yours; toast errors                            |
| 5         | Error Prevention                | 3         | Delete confirm; draft filters                                                         |
| 6         | Recognition Rather Than Recall  | 2         | Requests surface undiscoverable; My Deals overlap                                     |
| 7         | Flexibility and Efficiency      | 2         | FAB + shortcut; dense filter strip                                                    |
| 8         | Aesthetic and Minimalist Design | 2         | Chip wall + dual card CTAs                                                            |
| 9         | Error Recovery                  | 2         | Weak retry; requests fail→empty                                                       |
| 10        | Help and Documentation          | 1         | Private / quota / Add vs Browse unexplained                                           |
| **Total** |                                 | **21/40** | **Acceptable**                                                                        |

## Design Specificity Verdict

**LLM assessment:** On-system (cream canvas, green brand, shared list chrome) but weakly on-loop. Reads as generic owned-property inventory CRM more than “properties I’m allowed to sell after consent.” First-run CTA is “Add property”; `YourListingsTabs` is never mounted while `?tab=requests` still branches.

**Deterministic scan:** `impeccable detect` on `features/properties/your-listings`, `your-listings-tabs.tsx`, and `app/(role)/broker/your-listings` → `[]`, exit 0. No detector hits; issues are IA/copy/state, not token/pattern flags.

**Visual overlays:** Skipped — no live-browser mutation tooling in this session.

## Overall Impression

Solid Operate list scaffolding (header, chips, virtual grid, FAB, filtered vs first-run empty). Biggest gap: product job is half-finished — representing inventory teaches owner-builder behavior, and the requests half of the page is orphaned next to My Deals.

## What's Working

1. Peer consistency with other broker list pages (PortalSectionNav, filter chips, owned PropertyCard, cream/green).
2. Mobile primary action via FAB; desktop toolbar Add — one primary per viewport.
3. Representing empty split (filtered + Clear filters vs first-run) is structurally correct; Requests empty CTA to browse owner listings matches the core loop when that panel is reached.

## Priority Issues

1. **[P0] Broken / unfinished IA** — Dual-tab surface (`representing` / `requests`) with no tab UI; `YourListingsTabs` unused; My Deals already owns request flows. Brokers cannot discover half the page. Fix: one home for requests (likely My Deals) — mount tabs + redefine representing as represented inventory, or delete the dead path. Suggested: `/impeccable shape` then clarify/distill.

2. **[P1] First-run teaches the wrong job** — “No properties yet / Add property” (owner copy). Docs want “not representing yet / Browse…”. Activates private listing instead of consent loop. Suggested: `/impeccable onboard` + `/impeccable clarify`.

3. **[P1] Filter cognitive overload at 360px** — Filters + five quick chips + search + sort (≥6 controls). Outdoor one-handed use → mis-taps. Suggested: `/impeccable distill` / `/impeccable layout`.

4. **[P1] Requests panel state quality (if kept)** — Blank load; fail→zeros; weak filtered empty. Suggested: `/impeccable harden` / `/impeccable onboard`.

5. **[P2] Polish / trust nits** — Sticky filters without solid backdrop; toast.error for must-act failures; Private violet; unexplained weekly quota. Suggested: `/impeccable polish` + `/impeccable clarify`.

## Persona Red Flags

**Casey (field broker, cheap Android, outdoors):** Sticky chip row without opaque scrim; five chips + sort beside search = fat-finger risk; FAB good but “Add” may be wrong job.

**Jordan (first-timer):** “Your listings” vs My Deals vs Owner listings opaque; empty says add property; Attach owner / Private / Weekly quota unexplained; Requests tab unreachable.

**Project persona (Surat non-technical broker):** Feels like builder inventory admin, not “properties I’m allowed to sell”; silent request failure → “app has nothing.”

## Minor Observations

- Page `Suspense fallback={null}` vs peers with real skeletons; no `loading.tsx`.
- Intro status badges duplicate quick-chip counts.
- Naming: nav “Your listings” / mobile “Yours” / unused tab “My listings”.
- Owned card “No requests · Listed …” ambiguous (inbound vs broker’s own).

## Questions to Consider

1. Is “Your listings” private inventory, approved representations, or both — and if both, why isn’t that split the first thing on screen?
2. If My Deals owns request/invite flows, what job does `?tab=requests` still have?
3. Should a brand-new broker’s empty state ever say “Add property,” or must the first CTA be “Browse owner listings” until the consent loop is felt once?
