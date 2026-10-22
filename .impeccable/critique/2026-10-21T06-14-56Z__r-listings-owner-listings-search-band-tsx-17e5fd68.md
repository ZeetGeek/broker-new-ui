---
target: Owner listings top search band
total_score: 31
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 1
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\properties\\owner-listings\\owner-listings-search-band.tsx"
target_fingerprint: "sha256:1f07b3e36abd340805d316644de72115e52e4dfe29ef3e6f1f81247d9e23f4ac"
target_path: "D:\\Projects\\Office\\broker-new-ui\\features\\properties\\owner-listings\\owner-listings-search-band.tsx"
timestamp: 2026-10-21T06-14-56Z
slug: r-listings-owner-listings-search-band-tsx-17e5fd68
---

Method: dual-agent (A: fd26aacb-980e-479c-9b1a-a543147d5698 · B: 439f768f-466c-4862-be2b-37aa21c94516)

# Critique — Owner listings top search band

**Target:** `features/properties/owner-listings/owner-listings-search-band.tsx`  
**Mode:** Operate  
**Intent:** Go/no-go lock before Advanced Filters modal work

## Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                                   |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Segment active state is clear; apply-on-close is quiet until the list refreshes             |
| 2         | Match System / Real World       | 4         | Where / Looking for / Budget / Area / Category / Property type + INR/sqft fit Surat brokers |
| 3         | User Control and Freedom        | 3         | Band Reset works; phone cannot set 4 of 6 global dims today                                 |
| 4         | Consistency and Standards       | 3         | Segment grammar is cohesive; desktop 6 vs phone 2 without a bridge                          |
| 5         | Error Prevention                | 4         | Sale↔rent clears budget; category strips invalid property type                              |
| 6         | Recognition Rather Than Recall  | 3         | Eyebrow + value scan well; phone-hidden dims force guesswork                                |
| 7         | Flexibility and Efficiency      | 2         | Primary device (360px) cannot reach Looking for / Area / Category / Property type           |
| 8         | Aesthetic and Minimalist Design | 4         | One cream-bordered surface card, hairline dividers, no clutter                              |
| 9         | Error Recovery                  | 3         | Where has retry; wrong-filter recovery is Reset, not guided                                 |
| 10        | Help and Documentation          | 2         | No cue that phone hides most band dims or that Filters ≠ those dims                         |
| **Total** |                                 | **31/40** | **Good**                                                                                    |

## Design Specificity Verdict

**LLM assessment:** Product-specific enough to lock the desktop composition. Cream surface, warm border, brand-green icons, India budget dial (₹ L/Cr), Where + serviceable areas, commit-on-close + band-only Reset, and §5.6 global-dims-only split are YesBroker — not a stock MLS bar with a green tint. The multi-segment shape is familiar marketplace DNA (acceptable for Operate browse); character comes from India semantics and portal tokens.

**Deterministic scan:** 0 findings across 12 band/menu files. Folder-level only: `bounce-easing` warning in `owner-listings-budget-knob.tsx` (out of band scope; likely intentional for the dial).

**Visual overlays:** Browser skipped — no Next.js dev server running. Review used the user screenshot + source.

## Overall Impression

Desktop band is ready to lock as the marketplace signature. The single blocker for calling the _filter story_ final is phone reachability: Looking for, Area, Category, and Property type hide below `md`/`lg` and are not in the Filters sheet yet. That is Advanced Filters work, not a band redesign.

## What's Working

1. **Correct chrome for the job** — six global dims, commit-on-close, band-scoped Reset; Advanced stays free for type-specific dims (§5.6).
2. **India-native Operate craft** — Budget dial, Looking-for-aware scales, category→property-type stripping.
3. **Lockable segment grammar** — eyebrow / value / brand icon / active muted fill / warm dividers across all six menus.

## Priority Issues

**[P0] Phone cannot set Looking for / Area / Category / Property type**

- **What:** Those segments are `hidden` below `md`/`lg`; Filters sheet does not own them.
- **Why:** Android-first product; locking the band as complete without a phone path breaks discovery for the primary persona.
- **Fix:** Put those four dims in Advanced Filters (or an explicit phone pattern) with the same labels. Do not force six cells onto 360px.
- **Suggested command:** `/impeccable shape` (Advanced Filters IA) then implement

**[P1] Desktop teaches six cells; phone teaches two — no bridge**

- **What:** Progressive disclosure with no cue that more global filters exist elsewhere.
- **Why:** Brokers who see desktop demos then use phones hit a cliff.
- **Fix:** When Filters gains those dims, mirror labels exactly.
- **Suggested command:** `/impeccable clarify`

**[P2] Apply-on-close status is quiet**

- **What:** Closing a menu applies only if signature changed; band does not confirm.
- **Why:** On slow 4G, user may re-open wondering if it took.
- **Fix:** Keep list dim/count feedback reliable; no band restyle needed.
- **Suggested command:** `/impeccable harden` (list feedback)

**[P3] Reset copy singular**

- **What:** Visible “Reset filter” vs multi-dim band / aria “filters”.
- **Why:** Minor clarity nit.
- **Fix:** “Reset filters”.
- **Suggested command:** `/impeccable clarify`

## Persona Red Flags

**Surat broker on phone outdoors:** Only Where + Budget in thumb reach; Sale/Rent and Category unreachable without wider viewport; sticky header + band + second row burns first viewport; Budget dial needs precision one-handed.

**First-time broker:** Phone absence of Looking for looks like a missing product, not progressive disclosure; no hint that Filters ≠ Category; Where tree depth can intimidate if service areas are empty.

## Minor Observations

- Property type gates at `lg` while peers at `md` — intentional density; fine if documented.
- Area histogram is decorative (`buildAreaHistogram()` with no live pool) — do not promise inventory distribution in copy.
- Detector clean on band files; Budget knob bounce easing is out of scope for this lock.

## Questions to Consider

1. Is the phone story “thin band (Where · Budget) + full globals in Filters,” or do you still want more segments on 360px?
2. When Budget and Where are set and the list is still huge, should the next obvious move be Filters?
3. Should Advanced Filters own the four phone-hidden globals, or only type-specific dims (BHK, furnishing, etc.)?
