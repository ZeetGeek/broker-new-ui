---
target: portal header
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\components\\layout\\portal-header.tsx"
target_fingerprint: "sha256:81270dedfd8722efe3bb2aac08ca8bdaf7789e20f65f894ad39b65342e5928b0"
target_path: "D:\\Projects\\Office\\broker-new-ui\\components\\layout\\portal-header.tsx"
timestamp: 2026-11-18T12-20-29Z
slug: components-layout-portal-header-tsx
---
Method: dual-agent (A: d4db2089-7bf4-4d59-80b2-93833095b547 · B: f1be0ce3-849a-4027-80de-a8381ec25d59)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Active link + unread label; active treatment weaker vs mobile brand |
| 2 | Match System / Real World | 3 | Clients/listings/visits fit brokers; strip still generic CRM |
| 3 | User Control and Freedom | 3 | Logo home, dismissible menus, logout confirm; mobile loses full account menu |
| 4 | Consistency and Standards | 2 | Desktop vs mobile active color; cool gray-50 hover |
| 5 | Error Prevention | 3 | Logout confirm solid |
| 6 | Recognition Rather Than Recall | 3 | Labeled desktop nav; overflow More buries items |
| 7 | Flexibility and Efficiency | 3 | Shortcuts in tooltips/menu; Tasks/Earnings lack shortcutIds |
| 8 | Aesthetic and Minimalist Design | 2 | Materials quiet; seven peer links are not |
| 9 | Error Recovery | 2 | Confirm + toasts; notification failures lean toast |
| 10 | Help and Documentation | 3 | Shortcuts cheatsheet + WhatsApp support in profile |
| **Total** | | **27/40** | **Acceptable → low Good** |

## Design Specificity Verdict

**LLM assessment:** Mostly product-authored chrome, category-interchangeable IA. Cream canvas, house mark, account pill feel like YesBroker. Flat seven-item CRM strip does not encode the core loop.

**Deterministic scan:** `impeccable detect` on portal-header and components/layout returned 0 findings (exit 0), including --no-config. Empty scan is consistent with prior project critiques; does not prove clean live UI.

**Visual overlays:** Browser visualization skipped: no browser tool exposed. Fallback: user-supplied desktop screenshot + source reads.

## Overall Impression

Materials are OK — warm cream, clear regions, solid account pill. Biggest gap is IA: seven equal destinations (and Visits risking mobile overflow) dilute the broker day before content can lead.

## What's Working

1. Warm cream + mark + Broker account pill — authored identity, not stock SaaS.
2. Shared PortalHeader / profile primitives keep owner↔broker parity.
3. Shortcuts and confirmed logout without cluttering the bar.

## Priority Issues

**[P1] Flat seven-item top nav**
- Why: Exceeds working memory; Tasks/Earnings peer with Pipeline/Clients.
- Fix: Cap primary ≤5; park secondary under overflow/account.
- Suggested command: /impeccable distill

**[P1] Mobile bottom nav can bury Visits behind More**
- Why: Field-critical path conflicts with Android-first.
- Fix: Re-curate five bottom slots so Visits stays primary.
- Suggested command: /impeccable adapt

**[P1] Active-nav token drift**
- Why: Desktop ink underline vs DESIGN brand / mobile text-brand; gray-50 hover off warm system.
- Fix: One brand-green active recipe; warm muted hover.
- Suggested command: /impeccable polish

**[P2] Mobile account path ≠ desktop account menu**
- Why: Avatar→profile skips Saved/shortcuts/support/logout.
- Fix: Same menu as sheet, or Profile in bottom bar.
- Suggested command: /impeccable harden

**[P3] Dead searchHints prop / TEMP hidden main**
- Why: Shell API and content contract incomplete.
- Fix: Wire or remove searchHints; remove TEMP hidden.
- Suggested command: /impeccable polish

## Persona Red Flags

**Alex:** Must scan 7 peers; Tasks/Earnings lack nav shortcutIds.
**Casey (mobile):** Visits behind More is a field failure; avatar-only omits support/logout.
**Sam:** Thin underline location cue; badge count aria-hidden on glyph.
**Field broker:** Cream helps outdoors; crowded IA and More-buried Visits hurt.

## Minor Observations

- Notification rounded-2xl vs account rounded-full — unify to pill.
- DESIGN §5.3 Contacts/Profile copy stale vs Clients.
- Detector-adjacent: gray-50, unused searchHints, TEMP hidden main.

## Questions to Consider

1. If the first job is today's visits, why do Visits share rank with Tasks/Earnings?
2. Should desktop active speak brand green as loudly as mobile?
3. What if the header only answered "whose portal?" and "next deal action?"
