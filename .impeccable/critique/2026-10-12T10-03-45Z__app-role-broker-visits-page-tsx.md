---
target: broker visits page
total_score: 25
max_score: 40
na_heuristics:
p0_count: 2
p1_count: 2
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\app\\(role)\\broker\\visits\\page.tsx"
target_fingerprint: "sha256:0db34fe8c2d27f9bba758d29b862528f1c7d47b216cf2958f0742e407267408a"
target_path: "D:\\Projects\\Office\\broker-new-ui\\app\\(role)\\broker\\visits\\page.tsx"
timestamp: 2026-10-12T10-03-45Z
slug: app-role-broker-visits-page-tsx
---

# Critique: Broker Site Visits (`app/(role)/broker/visits/page.tsx`)

Method: dual-agent (A: 30aa4f76-ff6b-4276-a437-350c44563ef7 · B: 74a5fb6c-9d10-46c9-900b-d41b14e20305)

Mode: Operate · Target slug: `app-role-broker-visits-page-tsx`

#### Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                           |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Strong clocks/skeletons/toasts; overflow Cancel/Copy/note are inert |
| 2         | Match System / Real World       | 3         | Mostly plain copy; some CRM jargon (“Log outcome,” “Open slots”)    |
| 3         | User Control and Freedom        | 3         | Esc/URL clear well; withdraw/cancel lack confirm/undo               |
| 4         | Consistency and Standards       | 2         | Live DayRail+VisitCard vs unused WeekStrip+VisitTimelineRow         |
| 5         | Error Prevention                | 2         | ConflictPanel good; dead Cancel menu; withdraw without confirm      |
| 6         | Recognition Rather Than Recall  | 2         | Six summary chips + dual day filters (strip vs rail)                |
| 7         | Flexibility and Efficiency      | 3         | Shortcuts exist; help overclaims; chrome still fights busy days     |
| 8         | Aesthetic and Minimalist Design | 2         | Sticky tabs + 6 chips + rail + toggle before first visit row        |
| 9         | Error Recovery                  | 3         | Plain action/row errors; appropriate success toasts                 |
| 10        | Help and Documentation          | 2         | Keyboard-only help on a phone-first product                         |
| **Total** |                                 | **25/40** | **Fair — operable, overloaded**                                     |

#### Design Specificity Verdict

**LLM assessment:** Mostly authored for this product — IST clock, owner-confirm waits, buyer+owner parties, drive context, WhatsApp templates, NextVisitSpotlight. Undermined by generic CRM chrome (six filter chips + 14-day rail + list/week) and orphan denser day UI (`week-strip.tsx`, `visit-timeline-row.tsx`) that is staged but not mounted.

**Deterministic scan:** Source detect on `features/site-visits/broker` and `app/(role)/broker/visits` returned **0 findings**. URL detect against `localhost:3001/broker/visits` returned 5 warnings that are **auth-login false positives** (email/password placeholders), not visits UI.

**Visual overlays:** No reliable user-visible overlay. Browser mutation/inject unavailable; live-server was started then stopped without injection. Auth gate blocked URL Puppeteer from the real visits surface.

#### Overall Impression

The operational spine is right — time, next visit, book, wait, outcome — but the first viewport spends too much on navigation chrome for a Surat field broker on a 360px phone. Biggest opportunity: one day spine above the fold, and stop shipping fake/destructive affordances.

#### What's Working

1. **NextVisitSpotlight** — field-first peak: time, locality, drive, Directions + Open.
2. **BrokerVisitsHeader** — two-tone “Site visits.” + live IST attention fits outdoor ops.
3. **Contact affordances** — Call / WhatsApp with filled message; empty states point to browse/book without cute copy.

#### Priority Issues

**[P0] Chrome stack hides the day**

- **Why:** Sticky VisitsTabs + SummaryStrip (6 chips) + schedule header + DayRail push the first visit below the fold.
- **Fix:** Default My visits to spotlight + today’s rows; demote week/past chips; one primary CTA (“Book a visit”); drop duplicate “View requests.”
- **Suggested command:** `/impeccable distill`

**[P0] Destructive / fake actions on VisitCard**

- **Why:** Overflow menu lists Cancel / Copy / Add note / View property with no handlers; primary Withdraw fires without confirm.
- **Fix:** Wire or remove menu items; confirm cancel/withdraw with plain copy.
- **Suggested command:** `/impeccable harden`

**[P1] Two day navigators + orphan denser UI**

- **Why:** SummaryStrip focus overlaps DayRail; WeekStrip/VisitTimelineRow exist but are unused — unfinished day model.
- **Fix:** Ship one day control (prefer compact strip + timeline for busy days) or remove orphans from the story.
- **Suggested command:** `/impeccable layout`

**[P1] VisitCard too heavy for outdoor taps**

- **Why:** Photo + parties + three ghosts + primary + ⋯; OSM directions vs Maps habit for Indian field use.
- **Fix:** Promote Call / Navigate / status action; denser timeline row for list; Maps deep link if allowed.
- **Suggested command:** `/impeccable adapt`

**[P2] Help and status-colour misuse**

- **Why:** Help is keyboard-first; wait badges lean on urgent/pending mix.
- **Fix:** First-book tip near empty/Book; pending tokens only for waits.
- **Suggested command:** `/impeccable clarify`

#### Persona Red Flags

**Field broker (cheap Android, outdoors):** Sticky chrome steals viewport; long scroll to card footer actions; subtle empty-day text on cream; OSM vs Maps.

**First-time broker:** Book path jumps into buyer bar + property + filters sheet; “Open slots” / “Log outcome” jargon; no onboard for owner-confirm wait; duplicate Book vs Browse naming.

**Power user (busy day):** Shortcuts incomplete vs help; still fights 6 chips + 14-day rail + list/week; Requests vs “View requests” redundancy.

#### Minor Observations

- VisitsTabs count chips can show bare zeros.
- shadow-sm on sticky tabs/DayRail stacks elevation against a no-shadow separation system.
- RequestsTab wait copy is clearer than My visits wait labels — align them.
- List/Week toggle is desktop-shaped on 360px.

#### Questions to Consider

1. If the broker opens this in traffic between Vesu and Adajan, what is the **only** thing that must be visible without scrolling?
2. Should My visits / Open slots / Requests stay three tabs, or become one day view with booking as a sheet?
3. Is WeekStrip + VisitTimelineRow the real field UI — and if so, why is DayRail + fat VisitCard still shipping?
