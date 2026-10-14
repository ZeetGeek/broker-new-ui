---
target: owner brokers page
total_score: 23
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\app\\(role)\\owner\\brokers\\page.tsx"
target_fingerprint: "sha256:da75b3834882d94ab53157da39f2933813b4b581527f6323fa1528f6889181fd"
target_path: "D:\\Projects\\Office\\broker-new-ui\\app\\(role)\\owner\\brokers\\page.tsx"
timestamp: 2026-10-14T06-13-39Z
slug: app-role-owner-brokers-page-tsx
---

Method: dual-agent (A: f461ed0a-d38a-49c1-98d6-8c904ab598ad · B: f4762b38-d4cd-45bb-be19-511f74504c59)

#### Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                            |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| 1         | Visibility of System Status     | 3         | Skeletons/dim/"Finding brokers…" solid; invite/profile failures weak (toasts/silent) |
| 2         | Match System / Real World       | 2         | "Accepted representations"; My Brokers/Active; represent jargon                      |
| 3         | User Control and Freedom        | 3         | Clear filters/Cancel/Close; invite not undoable after send                           |
| 4         | Consistency and Standards       | 2         | Active = OwnerRequestCard; invite UX ≠ listing invite modal; H1 always Browse        |
| 5         | Error Prevention                | 2         | No empty-listings guidance; no already-pending guard                                 |
| 6         | Recognition Rather Than Recall  | 3         | Labels/tooltips/metrics; property context thin in invite                             |
| 7         | Flexibility and Efficiency      | 2         | No accelerators; two invite entry points of unequal quality                          |
| 8         | Aesthetic and Minimalist Design | 2         | Heavy chrome before first card; dual equal primary actions                           |
| 9         | Error Recovery                  | 2         | Load Try again OK; invite = toast; browse empty mis-copy                             |
| 10        | Help and Documentation          | 2         | TrustNote helps; Active empty / Verified depth thin                                  |
| **Total** |                                 | **23/40** | **Acceptable**                                                                       |

#### Design Specificity Verdict

**LLM assessment**: Partly authored for YesBroker, partly category-interchangeable CRM browse. TrustNote consent framing, Verified + RERA in profile, Surat locality lines, and invite→invitations flow are product-grounded. Sticky chip carousel + search chrome, generic metric strip, dual equal View profile/Invite CTAs, and Active tab reusing property-centric OwnerRequestCard are interchangeable B2B directory patterns.

**Deterministic scan**: Static detect on `features/owner-brokers` and the page: 0 findings (exit 0). URL detect on live `/owner/brokers`: 2 findings — `bounce-easing` (global `app/transitions-dev.css`, false positive for this surface) and `script-error`/`Failed to fetch` (env/network FP). Brand tokens not flagged.

**Visual overlays**: Live-server inject succeeded via CDP; 1 overlay banner for `bounce-easing` only. No reliable Human-tab Cursor browser overlay; CDP headless only. Treat detector signal as clean for owner-brokers markup.

#### Overall Impression

Solid Operate browse chrome and consent framing, but the page tries to be both a marketplace directory and a relationships list without giving either a clear primary. Biggest opportunity: make Invite the one job on Browse, and make My Brokers about people — not recycled request cards with "Accepted representations" empty copy.

#### What's Working

1. TrustNote — plain-language consent that matches the core loop.
2. Browse card anatomy — identity + Verified, metric strip, specialties, then actions; scannable once chrome clears.
3. Filter feedback — Finding brokers…, live count, filtered empty + Clear filters, list opacity while refetching.

#### Priority Issues

1. **[P1] Empty states wrong kind / no next step** — Browse unfiltered empty says "No brokers match your search"; Active says "Accepted representations will show up here" with no CTA. Fix: first-run vs search vs filtered copy per EMPTY_STATES; Active → plain language + Browse brokers CTA. Suggested: /impeccable onboard + /impeccable clarify

2. **[P1] Active tab is the wrong object** — My Brokers renders OwnerRequestCard / View property. Fix: broker-centric rows (avatar, name, properties count, activity, contact). Suggested: /impeccable shape

3. **[P1] 360px chrome + dual CTAs bury the task** — Trust + sticky tabs/search + filters; View profile and Invite equal weight. Fix: demote View profile; Invite filled primary; collapse filters on phone. Suggested: /impeccable distill + /impeccable layout

4. **[P2] Invite dialog under-hardened** — native select, toast errors, no pending/already-representing guards. Fix: align with InvitePropertyBrokerModal; inline errors; empty → publish listing. Suggested: /impeccable harden

5. **[P2] Page title / tab labelling fights the mode** — H1 always "Browse brokers."; chip "My Brokers / Active". Fix: tab-aware H1; chip "My Brokers" only. Suggested: /impeccable clarify

#### Persona Red Flags

**Jordan**: H1 says browse on Active; empty jargon; equal View/Invite freeze.
**Casey**: Invite not thumb-priority; toast errors vanish outdoors; sticky chrome eats space.
**Sam**: native property select; toast errors; silent profile fetch failure.
**Surat owner (project)**: muted trust body in sun; long chrome before first broker; invite brick if no published listings.

#### Minor Observations

- Sort "Verified first" vs relevance value naming.
- Route Suspense spinner only; prefer loading.tsx + skeleton.
- resultCount/totalCount both pass query.total so "of N" never shows.
- Specialty menu can grow unbounded from API facets.

#### Questions to Consider

1. Should Brokers be directory-first or listings-first invite?
2. Should Invite be the only card filled action?
3. Is My Brokers a people list or representations board?
4. What first-run empty sentence replaces "No brokers match your search"?
