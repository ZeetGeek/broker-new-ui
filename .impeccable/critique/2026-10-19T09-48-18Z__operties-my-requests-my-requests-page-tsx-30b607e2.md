---
target: broker my-deals page
total_score: 24
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 2
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\properties\\my-requests\\my-requests-page.tsx"
target_fingerprint: "sha256:58ec7f3e38b456272d777262dd72456cd6be082e0b41416b886c937f277b3549"
target_path: "D:\\Projects\\Office\\broker-new-ui\\features\\properties\\my-requests\\my-requests-page.tsx"
timestamp: 2026-10-19T09-48-18Z
slug: operties-my-requests-my-requests-page-tsx-30b607e2
---

Method: dual-agent (A: cdc54115-ded3-4584-87ca-831cff2996f4 · B: 33a130c5-e0dd-453b-8c28-ba360e2b91ea)

## Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                            |
| --------- | ------------------------------- | --------- | -------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Stages/skeletons solid; Invites list lacks load-error UI             |
| 2         | Match System / Real World       | 2         | “My Deals” ≠ request/invite inbox; decline labeled Cancel            |
| 3         | User Control and Freedom        | 3         | Clear filters / withdraw exist; high-stakes acts lack confirm        |
| 4         | Consistency and Standards       | 3         | Listing chrome reused; status vocab differs across intro/chips/sheet |
| 5         | Error Prevention                | 2         | Accept/decline/withdraw fire immediately on 360px                    |
| 6         | Recognition Rather Than Recall  | 2         | Attempt/reminder/quota rules buried in tooltips and ⋯                |
| 7         | Flexibility and Efficiency      | 3         | Search/sort/filters/virtual grid help; no “act now” default queue    |
| 8         | Aesthetic and Minimalist Design | 2         | Intro + chips + search/sort duplicate status work above the fold     |
| 9         | Error Recovery                  | 2         | Sent has retry; Invites silent on fail; mutation errors as toasts    |
| 10        | Help and Documentation          | 2         | Stage meta exists but barely surfaces on-card                        |
| **Total** |                                 | **24/40** | **Needs work**                                                       |

## Design Specificity Verdict

**LLM assessment:** Product-authored Operate surface — cream canvas, green-only brand, photo-overlay deal cards, “You get” commission framing, and stage copy like “You can sell this” / “Waiting for you.” Sticky chip carousel and Sent/Invites split feel native to this app. Specificity is undercut by branding a representation inbox as “My Deals” (pipeline mental model) and by chrome that could transfer to another marketplace with little change.

**Deterministic scan:** Source tree `features/properties/my-requests` + route: exit 0, `[]` (0 findings). Live URL scan on `:3000/broker/my-deals` returned 6 findings (low-contrast ×4, bounce-easing ×1, dark-glow ×1) but snippets show login placeholders — **auth gate, not authenticated My Deals**; treat as non-applicable to this surface until re-run logged in.

**Visual overlays:** Not injected. Browser mutation tools unavailable; Next on :3000 was up but overlay path skipped.

## Overall Impression

Strong phone-first deal cards and plain stage language. The biggest opportunity is aligning the page name and first viewport with the real job — act on requests and owner invites — and making high-stakes Accept/Turn down safer and clearer.

## What's Working

1. **Stage-led overlay cards** — status badge, muted terminal deals, one footer CTA: excellent Operate scan design for thumbs.
2. **Plain-language stage labels** — “You can sell this,” “Waiting for you” beat internal jargon.
3. **Empty-state discipline** — first-run vs filtered split; Invites first-run without a fake CTA.

## Priority Issues

1. **[P0] Invite decline labeled “Cancel” + no confirm on Accept/Decline**
    - **Why it matters:** Highest-stakes broker click after owner trust; “Cancel” reads as abort UI; mis-tap outdoors loses a deal.
    - **Fix:** Accept / Turn down (or No); confirm decline; keep busy state.
    - **Suggested command:** `/impeccable clarify`

2. **[P1] “My Deals” frames the wrong job**
    - **Why it matters:** Brokers expect pipeline/clients; they get request + invite status. First-timers won’t map Sent vs Invites to money.
    - **Fix:** Rename (e..g. Requests & invites) or default to a “Needs you” queue; reserve “deals” for post-approval work.
    - **Suggested command:** `/impeccable clarify` or `/impeccable shape`

3. **[P1] Above-the-fold chrome overload / status duplication**
    - **Why it matters:** On 360px, filters + tabs + chips + search + sort push cards below the fold; same facts in TextLoop, badges, and chips.
    - **Fix:** One status story; default action queues; search/sort behind Filters on mobile.
    - **Suggested command:** `/impeccable distill` or `/impeccable layout`

4. **[P2] Critical rules live in tooltips / overflow**
    - **Why it matters:** Field brokers rarely long-press tooltips; reminder quota and Cancel request stay invisible.
    - **Fix:** Inline microcopy on pending cards; explicit secondary for Cancel when pending.
    - **Suggested command:** `/impeccable clarify`

5. **[P2] Invites error & toast policy gap**
    - **Why it matters:** Sent has Try again; Invites list errors vanish; mutation failures use toasts against project message rules.
    - **Fix:** Same inline error + retry as Sent; durable failure on card/footer.
    - **Suggested command:** `/impeccable harden`

## Persona Red Flags

**Ravi — field broker, 360px Android, outdoors:** Chip carousel + search + sort steal first viewport; tooltips unusable; fat-finger Accept/Cancel on invite.

**Meera — first week:** “My Deals” vs Sent/Invites is opaque; attempt/reminder limits unexplained on-card.

**Sanjay — busy power user:** Eight status filters buried while three chips show; no bulk remind/accept; rotating headline is noise when scanning dozens of cards.

## Minor Observations

- Decorative orange “For rent” badge fights DESIGN.md (`urgent` = deadline only).
- Stage meta hints barely appear on the card surface.
- In-app Message affordance sits next to deferred chat scope — risk of a dead control.
- Sticky header without an explicit cream scrim may let photos bleed under chips.
- Tall cards (~520px estimate) = heavy scroll before the next decision.

## Questions to Consider

1. If this page only showed “Needs you” (waiting invites + accepted-without-buyer + remindable pending), would anyone miss the full archive?
2. Should “My Deals” mean post-approval selling work, while this inbox owns a humbler name?
3. Why teach attempt/reminder economics in tooltips instead of on the pending card footer?
4. Is Accept/Decline for an owner invite allowed to be as one-tap casual as bookmarking a listing?
5. What would a Surat broker trust more on a noisy street: a rotating headline, or one static line — “3 owners waiting on you”?
