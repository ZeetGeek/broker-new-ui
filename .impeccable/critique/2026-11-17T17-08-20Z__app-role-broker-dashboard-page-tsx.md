---
target: broker dashboard
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:D:\\PROJECTS\\OFFICE\\broker-new-ui\\app\\(role)\\broker\\dashboard\\page.tsx"
target_fingerprint: "sha256:33894ceacfdce16729fb5e4569fa69a87ff613161ca13b92564b8df4a36a0b13"
target_path: "D:\\PROJECTS\\OFFICE\\broker-new-ui\\app\\(role)\\broker\\dashboard\\page.tsx"
timestamp: 2026-11-17T17-08-20Z
slug: app-role-broker-dashboard-page-tsx
---
# Broker Dashboard critique

Method: dual-agent (A: 42ce3b8f-89f9-4723-8332-c2c861b50cea · B: 9d10bb91-6309-4eab-b683-c6e39233a7d1)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 1 | Visits today: 0 vs next visit / Today's visits with appointments; 31 vs gauge 24 |
| 2 | Match System / Real World | 3 | Strong India time/money/Client wording; gauge still abstract |
| 3 | User Control and Freedom | 2 | Visit delete without confirm/undo |
| 4 | Consistency and Standards | 1 | Live metrics vs mock WorkOverview; accent CTA; rainbow tasks/stages |
| 5 | Error Prevention | 2 | Destructive delete; Call dead-end popover |
| 6 | Recognition Rather Than Recall | 3 | Metric links help; stage dots need legend literacy |
| 7 | Flexibility and Efficiency | 2 | Quick-add helps; rotating summary slows scan |
| 8 | Aesthetic and Minimalist Design | 1 | Four metrics + three CTAs + dark card + rainbow + visits + tasks |
| 9 | Error Recovery | 2 | Shell error OK; delete lacks undo |
| 10 | Help and Documentation | 1 | No cue what gauge means or which overdue to do first |
| **Total** | | **18/40** | **Needs significant work** |

## Design Specificity Verdict

**LLM:** Partially authored (cream, green next-visit, INR, Client labels, India time). Structurally a generic SaaS CRM home once metrics/CTAs/rainbow pipeline/tasks dominate. Live header vs mock work cards undercuts product truth.

**Deterministic scan:** detect on `features/new-dashboard` → exit 0, `[]`. Browser auth wall; inject skipped.

**Visual overlays:** Unavailable (login redirect). Screenshot + source used.

## Overall Impression

Your next visit is the right Operate beat. Trust collapses when the strip says Visits today: 0 beside a full visit day. Density and multi-hue noise fight the one-green phone-first product. Biggest opportunity: one truth for visits + one primary action above the fold.

## What's Working

1. Your next visit dark card — Client/Owner, time, lime View visit.
2. Market fit — Asia/Kolkata, INR lakh/crore, Client language.
3. Metric strip deep links; overdue uses urgent when overdue > 0.

## Priority Issues

### P0 — Metric strip lies about visits (and clients)
Live strip vs mock WorkOverview: 0 visits vs Upcoming 5; 31 vs gauge 24.
Fix: one data plane; EMPTY_STATES copy when empty.
Commands: /impeccable harden + /impeccable clarify

### P0 — Literal empty counts
Large 0 and "0 upcoming · 0 need an update" violate EMPTY_STATES.
Fix: collapse to reassurance + Schedule visit link.
Commands: /impeccable clarify

### P1 — No single Operate focus at 360px
Three CTAs + four metrics + next visit + visits + tasks.
Fix: one lead action; demote secondary CTAs/metrics.
Commands: /impeccable distill then /impeccable adapt

### P1 — Colour diluted off the pipeline board
Stage rainbow on home gauge; task row blue/yellow/danger tints; Running sky chip.
Fix: stage hues on /broker/pipeline only; overdue via urgent; no danger for priority.
Commands: /impeccable quieter

### P2 — Primary action / token hygiene
Add client accent; hardcoded next-visit greens; hardcoded "Starts in 1 hour".
Fix: one Primary brand-ink; tokens; live countdown.
Commands: /impeccable polish

## Persona Red Flags

Priya: useless 0 first; CTA wrap; long stack before useful card.
Ramesh: 34 overdue with no ranked next; gauge opaque; contradiction feels broken; trash danger.
Power user: no bulk triage; inconsistent totals.

## Minor Observations

AddBuyerModal behind Add client; More control under 48px; inventory/activity adds more density; DESIGN max one highlight lead violated by CTA row.

## Questions to Consider

1. Only one number and one card — follow-ups overdue or next visit?
2. Is Pipeline overview documenting the board or a second pipeline UI §1.3 forbade?
3. What should Visits today say when clear — why was literal 0 allowed?
4. Is 34 a motivator or a reason to close the tab?
