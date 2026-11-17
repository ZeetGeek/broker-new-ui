---
target: broker dashboard
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\app\\(role)\\broker\\dashboard\\page.tsx"
target_fingerprint: "sha256:33894ceacfdce16729fb5e4569fa69a87ff613161ca13b92564b8df4a36a0b13"
target_path: "D:\\Projects\\Office\\broker-new-ui\\app\\(role)\\broker\\dashboard\\page.tsx"
timestamp: 2026-11-17T07-40-55Z
slug: app-role-broker-dashboard-page-tsx
---
Method: dual-agent (A: beefb49d-e5b6-4430-a638-eb469aaf71e6 · B: 664e1083-1ba5-4ad3-9f37-3ce78cbd547b)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Full-page spinner; rotating status; hardcoded “Starts in 1 hour” |
| 2 | Match System / Real World | 3 | Strong India/CRM vocabulary; charts feel abstract for phone brokers |
| 3 | User Control and Freedom | 2 | Visit delete one-tap/no undo; Call opens dead-end popover |
| 4 | Consistency and Standards | 2 | Three equal header CTAs; icon-only visit actions; toast.error vs policy |
| 5 | Error Prevention | 2 | Attendance Check/X and Trash2 commit instantly; no visit confirm |
| 6 | Recognition Rather Than Recall | 2 | Rotating headline; icon-only actions; pipeline colour dots |
| 7 | Flexibility and Efficiency | 2 | Deep links only; no accelerators/bulk; preview state unsynced |
| 8 | Aesthetic and Minimalist Design | 1 | Wall of modules: KPIs + charts + visits + tasks + listings + updates |
| 9 | Error Recovery | 2 | DashboardError ok; failures also vanish into toasts / raw messages |
| 10 | Help and Documentation | 1 | Little empty-state teaching; no help for stages/commission/phone |
| **Total** | | **19/40** | **Poor** |

#### Design Specificity Verdict

**LLM assessment**: Partly authored for YesBroker (India time, Client language, PriceWithCommission, dark NextVisit pairing Client+Owner, overdue urgency), but structurally a category-interchangeable SaaS CRM home: 4-KPI strip, radial pipeline, commission bar chart, fixed-height scroll cards, activity feed. Mock/illustrative analytics undercut product truth.

**Deterministic scan**: `impeccable detect` on `features/new-dashboard` and `app/(role)/broker/dashboard` both exit 0 with 0 findings. Detector did not catch density, IA, empty-state, or dead-end Call issues — those are structural/UX, not token-pattern hits. No false positives.

**Visual overlays**: No reliable user-visible overlay. Browser mutation tooling unavailable; app server not responding on localhost:3000; live-server injection skipped. Critique is source-based plus Assessment A review.

#### Overall Impression

The one product-true moment is `NextVisit`, then the page buries field work under analytics furniture. Biggest opportunity: make “today’s visits / next call” the only above-the-fold job and demote everything else.

#### What's Working

1. **`NextVisit` composition** — time → property → Client/Owner → dual CTA on brand-deep card matches DESIGN dark-attention pattern.
2. **India Operate details** — weekday date, India time, working areas, overdue urgency, Client copy, PriceWithCommission.
3. **Accessibility craft in spots** — focus rings, live regions, commission sr-only table, reduced-motion on rotating summary.

#### Priority Issues

**[P0] Wrong mobile priority / density**
- Why: DESIGN expects today’s site visits above the fold; 360px fold is CTAs + KPI grid; TodayVisits sits after NextVisit and Pipeline.
- Fix: One “Today” stack (next visit + needs-update + upcoming). Demote pipeline/commission/listings/updates. Collapse empty shells.
- Suggested command: `/impeccable distill` then `/impeccable layout`

**[P1] Call CTAs are dead ends**
- Why: Highest-stakes field action fails with “Phone number not shared”; no tel:/WhatsApp/recovery path.
- Fix: Real tel: when known; else deep-link recovery to add phone — never a dead popover.
- Suggested command: `/impeccable harden` (+ `/impeccable clarify`)

**[P1] Loading / empty violate project docs**
- Why: Centred spinner reads broken on 4G; fixed ~540–680px empty panels violate EMPTY_STATES collapse rule; literal 0 stats.
- Fix: Dashboard-shaped skeletons; collapse empty modules; follow EMPTY_STATES dashboard rewrite.
- Suggested command: `/impeccable onboard` (+ `/impeccable harden`)

**[P2] Three equal primaries in the header**
- Why: Add client / Add listing / Schedule visit compete; Schedule visit also duplicated in TodayVisits.
- Fix: One accent action by context; demote others.
- Suggested command: `/impeccable clarify`

**[P2] Mock analytics dominate home**
- Why: “Illustrative analytics” and preview-local visit mutations teach the wrong model and burn scroll on cheap Androids.
- Fix: Real data only, or a single honest summary line; charts on dedicated surfaces.
- Suggested command: `/impeccable quieter`

#### Persona Red Flags

**Alex**: No accelerators; one-row attendance; charts before work; preview state won’t persist.

**Sam**: Icon-only Check/X/Call/Trash; rotating live region; colour-dot pipeline; nested scroll focus traps; 32px menu trigger.

**Casey**: Work not thumb-zone/above-fold; tall modules lose place; tiny adjacent icon actions; horizontal tab/chart overflow.

**Field broker (360px, glare)**: Needs next address + Call; gets KPIs/donut first; Call fails without number; hardcoded “Starts in 1 hour” can lie; mock title `` corruption looks untrustworthy.

#### Minor Observations

- CSS Modules + shadows vs cream/flat card system.
- EMPTY_STATES dashboard rewrite largely unimplemented.
- Stats show standalone zeros.
- Schedule visit duplicated (header + TodayVisits).

#### Questions to Consider

- Should a broker between Vesu visits ever see a commission chart before dialing the next client?
- What if “Today’s visits” were the only above-the-fold module?
- Is “Illustrative analytics” proof earnings don’t belong on Operate Home yet?
- When Call has no number, is the product failing the visit or the client record?
