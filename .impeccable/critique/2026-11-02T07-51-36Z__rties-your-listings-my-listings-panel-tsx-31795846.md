---
target: My Listings empty state
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\properties\\your-listings\\my-listings-panel.tsx"
target_fingerprint: "sha256:85455ae28b11fbc24b01010048a282e8c36eec19b2e91cf87b9163a7272c274b"
target_path: "D:\\Projects\\Office\\broker-new-ui\\features\\properties\\your-listings\\my-listings-panel.tsx"
timestamp: 2026-11-02T07-51-36Z
slug: rties-your-listings-my-listings-panel-tsx-31795846
---
Method: dual-agent (A: 014db2e3-aab8-4e26-8a12-5b04b9ae8fba · B: 1eefa6bf-299d-4b49-b1b6-3d42d5546181)

Target: `features/properties/your-listings/my-listings-panel.tsx` (My Listings empty state)
Mode: Operate · Evidence: screenshot + source review + CLI detect (browser overlays unavailable)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Bare `0` badges on Published/Draft/Sold |
| 2 | Match System / Real World | 3 | Clear inventory copy; tabs assume CRM literacy |
| 3 | User Control and Freedom | 3 | Tabs, clear-filters, add path exist |
| 4 | Consistency and Standards | 2 | Two Add treatments; tab empty → first_run |
| 5 | Error Prevention | 2 | Wrong first-run empty when other tabs have inventory |
| 6 | Recognition Rather Than Recall | 3 | Labeled chrome; full CRM toolbar before any listing |
| 7 | Flexibility and Efficiency | 3 | Desktop `N` shortcut on toolbar Add |
| 8 | Aesthetic and Minimalist Design | 2 | Dual CTA + discovery chrome on zero inventory |
| 9 | Error Recovery | 3 | Filtered + load-error paths; tab-empty copy weak |
| 10 | Help and Documentation | 2 | Time estimate helps; Published/Draft/Sold unexplained |
| **Total** | | **25/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** Product-specific shell (cream canvas, green family, Filters + status tabs not marketplace band, “My Listings.” + rotating summary). Empty core is a standard Operate teach pattern — correct, not distinctive. Inventory “Add property” framing fits this surface’s job.

**Deterministic scan:** `impeccable detect` on `features/properties/your-listings` → `[]`, exit 0. No detector hits; issues are UX/state, not token flags.

**Visual overlays:** Skipped — no browser automation tool exposed this session.

## Overall Impression

Looks coherent and on-system. Biggest problem on this screenshot: first-run teaches well in the empty block, then the same screen asks again with a second solid Add and three circular zeros.

## What's Working

1. Correct list chrome for inventory — Filters sheet + status tabs, not marketplace band.
2. First-run empty anatomy — line icon, one headline, one body, one button in the block.
3. H1 avoids counting zeros — “Add your first property to get started.”

## Priority Issues

1. **[P1] Two same-weight Add property CTAs** — Toolbar accent + empty brand-ink. Fix: one solid primary; demote or hide the other while empty. Suggested: `/impeccable distill`
2. **[P1] Status chips show bare 0** — Violates empty-state rules. Fix: hide counts until total > 0. Suggested: `/impeccable clarify`
3. **[P1] Tab empties can use first_run when inventory isn’t empty** — `no_sold` unused; status excluded from active filters. Fix: branch on summary + status. Suggested: `/impeccable harden`
4. **[P2] Full Filters + Search + Sort on true first-run** — Extraneous before any listing. Suggested: `/impeccable distill`
5. **[P2] Anatomy drift** — EmptyState `h6` vs docs `h3`; icon size. Suggested: `/impeccable polish`

## Persona Red Flags

**Casey (field broker, phone):** Two Adds compete; Filters/Sort before inventory.
**Jordan (first-timer):** Three zeros can read as broken before teach copy lands.
**Riley (edge):** Draft/Sold empty with published inventory → false “No properties yet.”

## Minor Observations

- Filtered empty correctly uses Clear filters (good three-kind split).
- Desktop empty floats in cream — sparse, not broken.
- Shortcut kbd on toolbar Add only.

## Questions to Consider

1. If the empty block owns Add, why is toolbar Add still solid accent at zero inventory?
2. Day-one: one teach CTA + quiet chrome, or full CRM toolbar?
3. When Sold is empty but Published isn’t, should empty ever say “No properties yet”?
