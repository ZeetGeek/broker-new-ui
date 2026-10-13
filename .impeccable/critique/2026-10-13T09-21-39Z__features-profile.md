---
target: profile page
total_score: 25
max_score: 40
na_heuristics:
p0_count: 2
p1_count: 2
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\profile"
timestamp: 2026-10-13T09-21-39Z
slug: features-profile
---

Method: dual-agent (A: d720b4d7-f2f7-4205-8619-c8f812bca33b · B: c6c0afa9-b149-484e-9346-64f693f98684)

#### Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                                                   |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Save/upload pending solid; notification failures vanish in toast; no unsaved-leave warning  |
| 2         | Match System / Real World       | 3         | RERA/WhatsApp/Surat strong; Country, org/company split, owner photo blurb break the frame   |
| 3         | User Control and Freedom        | 2         | No discard; email dead-end; no undo for photo/verification                                  |
| 4         | Consistency and Standards       | 2         | Three save models (form Save, photo on pick, toggles on flip) with different error surfaces |
| 5         | Error Prevention                | 3         | onTouched + dirty Save + file checks solid; free-text GSTIN/RERA/areas; no leave-guard      |
| 6         | Recognition Rather Than Recall  | 3         | Labels mostly plain; dual save semantics still demand memorizing how the page works         |
| 7         | Flexibility and Efficiency      | 2         | Top-only Save scrolls away on phone; no sticky save; no essentials-first path               |
| 8         | Aesthetic and Minimalist Design | 2         | Four equal stat tiles + equal form cards = settings that reads like a second dashboard      |
| 9         | Error Recovery                  | 3         | Form/photo/load inline; notification toast + Confirm email with no action fail recovery     |
| 10        | Help and Documentation          | 2         | Section intros help; GSTIN/verification/locked email have no in-product how/where           |
| **Total** |                                 | **25/40** | **Acceptable**                                                                              |

#### Design Specificity Verdict

**LLM assessment**: Half-authored, half category-interchangeable. Role-split headline, RERA/GSTIN, WhatsApp-first alerts, Surat locality placeholders, and 10-digit phone normalization feel YesBroker. Counterweights: editable Country, stacked Organization + Company name, free-text comma lists instead of area pickers, broker-only trust copy on Profile photo for both portals, and a hardcoded yesbroker.in slug hint that reads like generic SaaS settings with India fields bolted on.

**Deterministic scan**: Static CLI scan of `features/profile/` and both route pages returned **0 findings** (exit 0). Live URL scans against localhost:3000 returned 5 findings each for `/owner/profile` and `/broker/profile`: 4× `low-contrast` warnings and 1× `bounce-easing`. Detector did not catch the P0 copy/toast issues the design review found.

**Visual overlays**: No reliable user-visible overlay. Browser mutation/inject path unavailable (no browser automation tools); live-server + detect.js skipped. Fallback: Puppeteer URL detect only.

Suspected false positives from URL scan: login placeholders (`you@example.com`, `Enter password`) likely auth gate, not profile UI; duplicate `#86867e` on `#f7f4ee`; bounce-easing unmapped to profile source (`line: 0`).

#### Overall Impression

Strong product writing and role branching, undermined by Operate-surface sprawl: three save contracts, a phone Save that floats away, and one wrong-portal photo line. Biggest opportunity — make “save trust signals” the single job: sticky save, correct photo copy, inline notification errors, collapse the rest.

#### What's Working

1. Audience-aware IA: owner preferences vs broker “Your work,” with Surat-shaped placeholders and domain fields where they belong.
2. Photo upload-on-pick with optimistic preview and inline failure — correct for phone behavior and not trapped behind Save.
3. Empty stats use “None yet” + next-step hints; verification is worded, not colour-only.

#### Priority Issues

**[P0] Profile photo copy is broker-only on both portals**

- Why: Owners misread the page as broker CRM; trust framing backfires.
- Fix: Branch copy — owner: “Brokers see this on your listings”; keep current line for brokers.
- Suggested command: `/impeccable clarify`

**[P0] Notification errors use toast.error**

- Why: On a jostling phone the flip looks saved then silently reverts; WhatsApp prefs are deal-critical. Violates docs/MESSAGES.md (toasts = transient success only).
- Fix: Inline `role="alert"` under the row; revert switch; toast for success only if at all.
- Suggested command: `/impeccable harden`

**[P1] Save changes only in header — lost on long mobile scroll**

- Why: Dirty bio/RERA edits get abandoned; peak-end dies on notification toggles.
- Fix: Sticky bottom bar on small screens when `isDirty`; confirm on navigate.
- Suggested command: `/impeccable adapt`

**[P1] Owner IA: Organization + Company name; GSTIN under preferences; editable Country**

- Why: Reads as generic account settings; Surat owners don’t need Country; prefs ≠ tax identity.
- Fix: One business-name field; move GSTIN/company to Business details; lock/drop Country; chip-based cities/localities.
- Suggested command: `/impeccable distill`

**[P2] Verification / locked email with no CTA**

- Why: First-timers stall in “Confirm your email” / “Awaiting review” with nowhere to tap.
- Fix: Resend email / “What we check” link; named support path for email change.
- Suggested command: `/impeccable onboard`

#### Persona Red Flags

**Jordan (First-Timer)**: Opens to four “None yet” / verification tiles with nowhere to tap; full form including public page, GSTIN, comma lists — no “fill these three so brokers trust you” path.

**Sam (Accessibility)**: Notification failure only in toast; primary Save is `size="md"` (44px) vs 48px mobile floor; bio count/error swap without a stable live-region strategy.

**Casey (Distracted Mobile)**: Edits About you at the bottom, never re-finds Save; flips SMS, gets a toast, looks away — preference may have failed; three save rules = near-certain partial saves.

**Surat field broker (project)**: `ink-subtle` helpers wash out outdoors; typing Vesu/Adajan/Piplod on a cramped keyboard; no visible +91 chrome on Mobile number; WhatsApp toggle is correctly scary but error recovery is the weakest part of the page he depends on most.

#### Minor Observations

- Broker slug helper hardcodes `yesbroker.in` while product name is a placeholder.
- Owner slug helper vs broker URL preview are inconsistent.
- Average time to close shows “—” vs “None yet” elsewhere.
- Skeleton omits notification block — slight layout jump risk.
- RERA state as free text should be Gujarat-first select for phase 1.
- Stats row teaches the core loop but steals Save attention on a settings surface.
- Detector URL low-contrast on `#86867e` / `#f7f4ee` may reflect real muted helper contrast outdoors (aligns with Casey/Surat persona), even if auth placeholders are false positives.

#### Questions to Consider

- If the only job is “make the other side trust you,” why is Country editable and WhatsApp below the fold?
- Should unverified brokers see RERA + photo + areas first, with GSTIN/slug collapsed until the trust trio is done?
- Is a profile with four KPI tiles still settings, or an accidental second dashboard?
- When photo and notifications already auto-save, what contract justifies a separate Save changes — or should the whole page be autosave with one clear “Saved” status?
