---
target: pipeline page
total_score: 19
max_score: 40
na_heuristics:
p0_count: 2
p1_count: 2
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\pipeline\\pipeline-page.tsx"
target_fingerprint: "sha256:8860b2cb999684c044c6a15f9a08865b8653600ab382ab438a3f80d5c95bdca6"
target_path: "D:\\Projects\\Office\\broker-new-ui\\features\\pipeline\\pipeline-page.tsx"
timestamp: 2026-10-06T10-48-53Z
slug: features-pipeline-pipeline-page-tsx
---

Method: dual-agent (A: 8b71582b-577f-4173-af3f-169fb3611c5b · B: 6473b887-fea4-47ae-809c-3125cd3705fd)

#### Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                                    |
| --------- | ------------------------------- | --------- | -------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 2         | Column totals and stall chips help, but quiet deals stay buried under photos                 |
| 2         | Match System / Real World       | 1         | Western ₹M instead of lakh/crore; stage labels look settled while product lists them as open |
| 3         | User Control and Freedom        | 3         | Drag handle, clearable chips, cancelable modals — solid exits                                |
| 4         | Consistency and Standards       | 2         | Board vs list density diverge; footer icon soup vs labeled list actions                      |
| 5         | Error Prevention                | 2         | "Representation ended" can sit beside "Mark contacted" with weak face guardrails             |
| 6         | Recognition Rather Than Recall  | 2         | Call / WhatsApp / Note / ⋯ / drag are icon-only                                              |
| 7         | Flexibility and Efficiency      | 2         | Filters and DnD exist; no bulk triage; still card-by-card                                    |
| 8         | Aesthetic and Minimalist Design | 1         | Hero photo + parties + chips + icons + CTA — Operate UI dressed as a listing page            |
| 9         | Error Recovery                  | 3         | Plain errors / move undo exist in product behavior; not visible on the board face            |
| 10        | Help and Documentation          | 1         | No stage meaning on the board                                                                |
| **Total** |                                 | **19/40** | **Poor**                                                                                     |

#### Design Specificity Verdict

**LLM assessment:** Mostly category-interchangeable CRM kanban with a few real YesBroker signals. Authored for this product: buyer + owner on every card, "Representation ended," competing buyers, stage verbs like "Book a visit." Not authored: pastel HubSpot-shaped columns, photo-hero cards, Western "₹19.8M," Board/List chrome. For Surat field brokers who think in lakh/crore and need "who do I call next," this still reads as imported software.

**Deterministic scan:** `impeccable detect --json features/pipeline` exited 0 with **0 findings** (`[]`). Detector did not catch density, money-format, or icon-label issues — those are judgment calls the scan does not encode. No false positives (empty set).

**Visual overlays:** No reliable user-visible overlay. Fallback signal: `NO_BROWSER_AUTOMATION` (no page-mutation/browser tools in session; Next was up on :3000 but unused for injection).

#### Overall Impression

The board correctly puts buyer and owner together and gives each stage a clear next verb — that is the product's core loop made visible. The single biggest opportunity is to stop treating this like a property catalog: photos and Western money formatting are winning the glance that should belong to "call these three before sundown."

#### What's Working

1. **Domain facts on the card** — buyer + owner, representation ended, competing buyers make the consent-gated loop visible, not a generic contact field.
2. **Stage-aware primary verbs** — "Mark contacted," "Book a visit," "Start negotiating," "Revise offer" tell the operator the next move without opening the card.
3. **Attention language over color-only alarms** — "No response · 18 days" is more honest than tinting every stalled card red.

#### Priority Issues

**1. [P0] Photo-first cards destroy pipeline scan density**

- **What:** ~4:3 hero image dominates; roughly one full card + a peek per column.
- **Why:** Brokers on phones between visits cannot scroll a magazine to find a stalled visit. Operate mode needs "which deal, what next."
- **Fix:** Shrink or defer photos on the board; lead with next action, parties, money, stall. Keep rich media for detail.
- **Suggested command:** `/impeccable distill`

**2. [P0] Money speaks Western SaaS, not Indian brokers**

- **What:** Screens show ₹19.8M, ₹105.5M, ₹44.3M.
- **Why:** Field brokers quote lakh/crore aloud. Misread prices = wrong prioritization and lost trust.
- **Fix:** Display ₹1.98 Cr / ₹44.3 L (exact digits in detail). Same convention on column and summary totals.
- **Suggested command:** `/impeccable clarify`

**3. [P1] Icon-only field actions fail the phone-first brief**

- **What:** Five tight glyphs (call, WhatsApp, note, ⋯, drag) + outlined CTA.
- **Why:** Outdoors, no tooltip, fat finger, glare. Primary contact actions are the daily path.
- **Fix:** Promote Call + WhatsApp as labeled ≥44px controls; bury drag/note/overflow.
- **Suggested command:** `/impeccable adapt`

**4. [P1] Chrome asks the broker to configure the board before working it**

- **What:** Search, three filters, sort, Board/List, four summary chips above the columns.
- **Why:** Extraneous load for a non-technical operator whose job is "call the quiet ones."
- **Fix:** Default to a work queue (quiet / due follow-ups); demote Board/List and secondary filters.
- **Suggested command:** `/impeccable shape`

**5. [P2] Stages look settled; meanings are invisible**

- **What:** Colored New / Contacted / Site visit / Negotiation with no hint on the board.
- **Why:** Product says stage names are open; UI teaches them as fact.
- **Fix:** Confirm stage model with users before polishing; add one-line stage purpose if kept.
- **Suggested command:** `/impeccable clarify`

#### Persona Red Flags

**Alex (power):** No bulk move/pin/quiet-triage — 15 deals in New is serial clicking. Board/List is a view preference, not an accelerator.

**Casey (distracted mobile) — CRITICAL:** Desktop kanban screenshots; mobile collapses to stage tabs so cross-stage status vanishes when interrupted. Icon row + drag are thumb-hostile. Photo height pushes CTA out of thumb zone. Gray meta will wash out in Surat sun.

**Surat field broker:** ₹19.8M does not match how he prices aloud. "Representation ended" + "Mark contacted" on the same card is unclear. Mock localities (Kharadi, Wakad, Noida) on a Surat-first product teach the wrong world.

#### Minor Observations

- Sale + rent totals in one column header is correct accounting but easy to misread as one pile.
- Outlined primary CTAs under-emphasize the only action that advances the deal.
- Exclusive / competing-buyer chips are good but fight the photo for attention.
- Board vs List is a second IA, not a density control.

#### Questions to Consider

- If the broker has 60 seconds between two site visits, is this a board — or should the default be a single "Call these three" list?
- Why is the property photo larger than the buyer name and the next action?
- Would a Surat broker ever say "nineteen point eight em"?
- Are New / Contacted / Site visit / Negotiation the work — or placeholders being polished too early?
