---
target: broker tasks page
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\tasks\\tasks-page.tsx"
target_fingerprint: "sha256:313e121a4db693bf074436544836af06f67bdee9c9a28a55936f7f3f6d260fd7"
target_path: "D:\\Projects\\Office\\broker-new-ui\\features\\tasks\\tasks-page.tsx"
timestamp: 2026-11-17T06-42-15Z
slug: features-tasks-tasks-page-tsx
---
Method: dual-agent (A: 369442e4-4743-456f-84b9-2babb1cba088 · B: a39334d1-a899-4808-9f33-0cea25c24a48)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | Completion linger + toasts strong; loading skeleton always 5-col, often lying about real density |
| 2 | Match System / Real World | 3 | Mostly plain follow-up language; column dates use MMM d, yyyy not India dd/mm cues; "linked records" is CRM-speak |
| 3 | User Control and Freedom | 3 | Restore / reopen / clear filters work; clearing an inline title soft-deletes with no confirm |
| 4 | Consistency and Standards | 2 | Overdue as tab and icon; Add modal vs inline quick-add; priority colors fight one-green / urgent rules |
| 5 | Error Prevention | 2 | Delete dialog good; empty-title → Deleted and fat-finger complete under-guarded on phone |
| 6 | Recognition Rather Than Recall | 2 | Desktop check/⋯ hover-only; date/priority in menu icon-only; desktop edit needs double-click |
| 7 | Flexibility and Efficiency | 3 | Drag, quick-add DSL, sorts, column prefs — strong without blocking basics |
| 8 | Aesthetic and Minimalist Design | 2 | Ruled paper is quiet; toolbar + 4 tabs + filters + Someday notebook is a second product stacked on the first |
| 9 | Error Recovery | 3 | Deleted restore, reopen, filter clear, load-error reset — solid |
| 10 | Help and Documentation | 2 | Quick-add help exists; planner metaphor, double-click edit, notebook IA largely undocumented |
| **Total** | | **25/40** | **Acceptable** |

#### Design Specificity Verdict

**LLM assessment:** Authored hybrid, not category-generic — but the TeuxDeux×portal lock is only ~70% held. YesBroker-specific: cream portal shell, rotating Tasks summary, green today accent, white ruled paper, title-led rows, 2s complete-and-linger, overdue kept on original dates, phone-visible 44px controls. Bleeds toward SaaS CRM: fourth Overdue tab, multi-hue priority washes, notebook under Someday, and a 1-day collapse for light planners so the signature five-column paper rarely appears.

**Deterministic scan:** Static `impeccable detect --json features/tasks` → exit 0, 0 findings. Puppeteer URL detect on `/broker/tasks` (desktop + mobile) → exit 2, 2 warnings: `bounce-easing` (`cubic-bezier(.34, 1.35, .64, 1)`) and `dark-glow` (zero-offset `#1b7a5a` shadow). Both attributed to global `transitions-dev.css` / brand focus rings, not tasks-authored CSS — treated as false positives for this surface.

**Visual overlays:** No reliable user-visible overlay. Live-server started then stopped; CDP inject failed (no Chrome/Edge binary); no IDE browser mutation tool. Fallback: Puppeteer URL detect only.

#### Overall Impression

The ruled paper and completion ritual are the strongest parts — quiet, on-brief, phone-aware. The biggest opportunity is to stop the page from being three products at once (day planner + overdue triage CRM + notebook) so the first viewport is clearly "work today's lines."

#### What's Working

1. **Paper list craft** — 40px ruled lines, blank filler rules, title-first rows, hover-quiet desktop controls and always-on touch controls: TeuxDeux soul, implemented with care.
2. **Operate completion ritual** — optimistic check + 2s linger in To do + toast, without URL thrash.
3. **Portal identity above the fold** — section nav, "Tasks." + rotating summary, Filters/search/sort/Add, no sidebar.

#### Priority Issues

**[P1] Desktop rarely shows the brief's default 5-day paper**
- Why: Column resolver collapses to 1 day when populated dates are few; new/light planners never look like TeuxDeux.
- Fix: Default visible days to min(5, viewportMax) with empty ruled columns; use populated-count only to limit the picker.
- Suggested command: `/impeccable layout`

**[P1] Fourth "Overdue" status tab vs approved 3-view IA**
- Why: Brief pins To do / Completed / Deleted; peer Overdue tab duplicates column+icon model and adds triage anxiety.
- Fix: Remove Overdue tab; keep count in rotating summary + per-row mark; optional Filters chip only.
- Suggested command: `/impeccable distill`

**[P1] Someday is a notebook product, not "undated beneath"**
- Why: Tabs, list counts, create-tab, pagination compete with planning today.
- Fix: One Someday list by default; bury list management behind a single Lists affordance.
- Suggested command: `/impeccable quieter`

**[P2] Priority washes + multi-hue tab dots break one-green / urgent grammar**
- Why: Blue/yellow/danger-red priority and sky/emerald status dots fight DESIGN.md.
- Fix: Priority via flag/weight or brand-soft tints; overdue exclusively urgent orange.
- Suggested command: `/impeccable colorize`

**[P2] Phone chrome density before the day list**
- Why: Filters + 4 tabs + search + sort + Add burn the first fold before the paper.
- Fix: Keep Add + view switcher; fold search/sort into Filters/overflow; get day + composer into first 360×640 fold.
- Suggested command: `/impeccable adapt`

#### Persona Red Flags

**Casey (Distracted Mobile User):** Top-heavy toolbar before the day; Add not thumb-zone; Task details buried in ⋯; empty-title blur → Deleted is high fat-finger cost; Someday chrome invites accidental management.

**Jordan (First-Timer):** Two create paths (modal vs blank line) with no guidance; desktop double-click edit only in tooltip; Create tab (+) icon-only; quick-add DSL needs help panel or first attempt feels broken.

**Sam (Accessibility):** Desktop check/⋯ opacity 0 until hover; date/priority menu icon-only; priority row background is color-only; Move aria-label on sortable line can confuse edit intent.

#### Minor Observations

- Filtered To do swaps ruled planner for flat Matching tasks — jarring vs history dated columns.
- Loading always shows five block skeletons with no phone collapse — layout jump risk.
- Day labels miss TeuxDeux uppercase cue; column dates are US-month-first.
- Completed/Deleted history planner correctly reuses paper — strong continuity.
- Local workspace updates without router.push honor no-URL-churn brief.

#### Questions to Consider

1. If TeuxDeux is the reference, why does a broker with three tasks ever see a one-column desk instead of five empty ruled days?
2. Is Overdue a view people choose, or a condition that should haunt the day they already scheduled?
3. Should Someday feel like a bottom drawer for undated lines, or a Notion-lite notebook?
4. What would disappear if the only first-run action was "type on today's line"?
5. Can priority earn its keep without painting the paper in a second palette YesBroker forbids?
