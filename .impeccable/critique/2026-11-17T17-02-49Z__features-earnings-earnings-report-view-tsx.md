---
target: broker earnings page
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\PROJECTS\\OFFICE\\broker-new-ui\\features\\earnings\\earnings-report-view.tsx"
target_fingerprint: "sha256:f55cdfb965742a22c1cbe0570437ec5258eacf327808a8013b4375c63e85e0d3"
target_path: "D:\\PROJECTS\\OFFICE\\broker-new-ui\\features\\earnings\\earnings-report-view.tsx"
timestamp: 2026-11-17T17-02-49Z
slug: features-earnings-earnings-report-view-tsx
---
# Broker Earnings critique

Method: dual-agent (A: 2615a94b-6427-4b6d-8fa9-b2c374b15072 · B: a64056c8-43e5-46b8-a188-ad81add9444b)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Period + partial-month cue clear; "0 days" Time to sell reads broken |
| 2 | Match System / Real World | 3 | Strong INR/plain copy; "Win rate" / dual legends still analyst-speak |
| 3 | User Control and Freedom | 3 | URL period, Cancel/Apply calendar, Open pipeline |
| 4 | Consistency and Standards | 1 | Stage/chart hues used outside pipeline board (DESIGN §1.3) |
| 5 | Error Prevention | 3 | Future dates blocked; custom Apply gated |
| 6 | Recognition Rather Than Recall | 3 | Labels present; likely/possible gauge still abstract |
| 7 | Flexibility and Efficiency | 2 | Period + chart toggle help; 10 presets noisy; no sale/rent filter |
| 8 | Aesthetic and Minimalist Design | 2 | Money buried under 4 equal KPIs; sparse chart; multi-hue noise |
| 9 | Error Recovery | 3 | Load/empty/sample recovery paths are plain and actionable |
| 10 | Help and Documentation | 2 | Estimate notes good; little help for win rate / likely / loss framing |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity Verdict

**LLM:** Half-authored for YesBroker (cream canvas, brand-deep lime hero, India money copy, estimate honesty), half generic SaaS analytics (equal KPI strip, sky/amber/violet chart language, empty-month bar chart). Swap the logo and much of the page could be any CRM.

**Deterministic scan:** `impeccable detect --json features/earnings` → exit 0, `[]` (0 findings). Browser inject hit auth wall; one `bounce-easing` on login `body` — out of scope / not attributed to earnings.

**Visual overlays:** No reliable earnings overlay — unauthenticated redirect to `/login?next=/broker/earnings`. Review used attached desktop screenshot + source.

## Overall Impression

The dark Estimated earnings card is the right emotional peak and the copy is market-aware. The page still leads with outcomes and a multi-hue analytics kit that fights the one-green Operate system, then ends on losses. Biggest opportunity: make ₹ the first answer and keep stage rainbow on the pipeline board only.

## What's Working

1. Estimated earnings dark card — brand-deep + lime ₹ + sale/rent split + monthly average.
2. Copy discipline — estimate framing, "Clients who did not go ahead", sample-data honesty, INR periods.
3. Range picker craft — presets vs custom Cancel/Apply, future dates disabled, URL-backed period.

## Priority Issues

### P1 — Stage/chart hues used as earnings brand
**Why:** `--chart-*` aliases `stage-1…4`; DESIGN §1.3 says exception stops at the board. Sale sky, rent amber, win violet, sold emerald make Earnings read as a second product.
**Fix:** Brand greens + neutrals + labels/patterns for sale vs rent; reserve sky/violet/amber/emerald for pipeline stage pills only.
**Suggested command:** `/impeccable colorize`

### P1 — Money is not first-fold primary
**Why:** Brokers open Earnings for commission; Sold/Lost/Win/Time lead with equal weight.
**Fix:** Lead with Estimated earnings; demote outcomes or collapse Win/Time on 360px.
**Suggested command:** `/impeccable layout`

### P1 — Loss-dominated story + "0 days"
**Why:** "7 lost" and "0 days" teach failure/broken math before money lands.
**Fix:** Sold/money-first headline when earned; soften Lost weight; never show proud "0 days" — use "Same day" / hide until avg ≥ 1.
**Suggested command:** `/impeccable clarify`

### P2 — Empty-heavy commission chart
**Why:** One November bar + five empty months wastes the largest surface.
**Fix:** Tighten window, sparse annotation, or shorter default when density is one spike.
**Suggested command:** `/impeccable distill`

### P2 — Mobile cognitive stack
**Why:** Full stack of cards + 10 presets is a wall at 360px outdoors (source-inferred; live mobile blocked by auth).
**Fix:** Progressive disclosure; short preset chips; chart/pipeline secondary.
**Suggested command:** `/impeccable adapt`

## Persona Red Flags

**Priya (Surat broker, 360px outdoors):** Money below outcome strip; multi-hue wash in glare; tall sparse chart burns scroll; win % abstract vs ₹.

**Ramesh (first week, non-technical):** Must reconcile Sold/Lost/Win/₹/sale-rent/likely; ends on why-lost without a clear next call.

**Desktop power user:** No sale/rent filter or export; 10 presets flexible but noisy.

## Minor Observations

- Two-tone headline uses `h3` not signature `h1`.
- Dark hero as summary vs §4.2 "action" attention cards — works as money peak, slight semantic stretch.
- Chart `sr-only` data table is strong a11y.
- Urgent chip for stalled deals correctly reserved.
- Footer estimate legalese easy to miss after losses.

## Questions to Consider

1. If Earnings has one job, why does Lost share a podium with Sold before the rupee?
2. Are sky/violet/amber chart colours serving brokers, or only looking like generic analytics while breaking the board-only exception?
3. Should the page end on money still in play + one CTA, with "why lost" behind a tap?
4. What should "0 days" ever mean on a phone in sunlight?
