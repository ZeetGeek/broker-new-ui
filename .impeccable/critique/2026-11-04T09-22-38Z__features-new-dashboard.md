---
target: features/new-dashboard
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\new-dashboard"
timestamp: 2026-11-04T09-22-38Z
slug: features-new-dashboard
---
Method: dual-agent (A: 06131017-4a1a-4f27-a5d2-eaad53eac602 · B: 36a69525-a753-4f90-8ee3-d46c6f1551c9)
Target: features/new-dashboard (Operate · broker CRM home)
Score: 18/40 (Poor)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Greeting/metrics disagree with WorkOverview; listings error soft |
| 2 | Match System / Real World | 3 | Client/Visits/Pipeline/India time strong; Urgent vs danger muddied |
| 3 | User Control and Freedom | 2 | Delete no undo; Call dead-end |
| 4 | Consistency and Standards | 1 | Dual data sources; 0 vs 3 visits; 28 vs 24 clients |
| 5 | Error Prevention | 1 | False clear calendar; Call that cannot call |
| 6 | Recognition Rather Than Recall | 2 | Icon-only row actions; Pipeline nav vs overview unclear |
| 7 | Flexibility and Efficiency | 2 | No one-tap tel:; 31 follow-ups only as a number |
| 8 | Aesthetic and Minimalist Design | 2 | Tokens good; tabs+groups+fixed cages+duplication = noise |
| 9 | Error Recovery | 2 | Strip error no retry; Call no recovery |
| 10 | Help and Documentation | 1 | Needs update / first-week path unexplained |
| **Total** | | **18/40** | **Poor** |

## Design Specificity Verdict

**LLM assessment:** Visually authored for this product (cream canvas, brand-deep next-visit, Client/Visits vocabulary, Surat localities, India time). Operating model is still a generic dashboard collage — metric strip + three equal panels + three create CTAs. Not category-interchangeable in look; interchangeable in job.

**Deterministic scan:** `impeccable detect --json features/new-dashboard` returned `[]` (0 findings, exit 0). Runtime contradictions (dual mock/API sources) sit outside the static scanner.

**Visual overlays:** No reliable user-visible overlay. Browser mutation/injection unavailable in this session; live-server skipped. Fallback: CLI + screenshot + source evidence only.

## Overall Impression

Craft and tokens are strong; truthfulness is not. Biggest opportunity: one day model so greeting, strip, next visit, and Today's visits all agree — then make Call actually call.

## What's Working

1. Next-visit brand-deep hero — correct Operate attention pattern.
2. System fidelity in chrome — cream, Client vocabulary, stage strip, India time.
3. Task interaction craft — delayed complete, aria-live, keyboard tabs, privacy footer.

## Priority Issues

### [P0] Dual source of truth — greeting / Visits today vs WorkOverview
Greeting says calendar clear; strip shows Visits today 0; WorkOverview shows 3 visits and a next visit. Active clients 28 vs pipeline 24. Fix: one day model feeds all surfaces.

### [P0] Call is a false primary action
Call client / row Call → Phone number not shared. Fix: real tel: when number exists; otherwise disable with Add phone — never a Call that cannot call.

### [P1] Phone-first collapse fights the day
Stack order Next → Pipeline → Today's visits; fixed ~600–680px nested scroll. DESIGN §5.1 wants today's visits above the fold. Fix: Next → visits → tasks slice → compact pipeline; page scroll, not card cages.

### [P1] Today's visits IA — tabs, density, hero duplication
Tabs + in-list group headers for 3 visits; Priya duplicated in hero; Call/View icon-only. Fix: chronological list; needs-update as row status; labeled Call primary.

### [P2] My Tasks density + semantic color
Three ghost icons per row; Urgent→danger; High→stage amber. Fix: overflow menu; urgent token only for time pressure.

### [P2] Pipeline overview vs Pipeline nav
Restates stages; counts disagree; only unique value is Needs attention. Fix: shrink to stall CTA or deep-link tiles.

### [P2] Active listings error in metric strip
Value 0 in brand green + Couldn't load listings. Fix: error state, hide confident 0, inline Retry.

## Persona Red Flags

**Field broker:** Nested scroll; Call doesn't call; contradictory clear vs next visit in 1 hour.
**First-week broker:** Needs update unexplained; three create CTAs before understanding today's work.
**Power user with 31 overdue:** Billboard with no triage; tasks and follow-ups are two urgency systems.

## Minor Observations

- Visits header date Tuesday 3 Nov vs live Wed 4 Nov.
- RotatingHeaderSummary can claim clear while facts contradict.
- Task attachments in mock never render.
- View all + Open visits duplicate egress.

## Questions to Consider

1. If the broker may only act on one thing before the next visit, should anything except Next visit + log earlier outcome exist above the fold?
2. Is My tasks a third system of record, or should visits + follow-ups be the task list?
3. Should Pipeline overview earn a dashboard card if Pipeline nav + Active clients already exist?
