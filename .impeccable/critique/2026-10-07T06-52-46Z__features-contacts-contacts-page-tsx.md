---
target: contacts page + add buyer/owner sidebars
total_score: 22
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\contacts\\contacts-page.tsx"
target_fingerprint: "sha256:9e1585864e80ba14c0f083bd9b751c09f0c370f201a82647052be7379af86517"
target_path: "D:\\Projects\\Office\\broker-new-ui\\features\\contacts\\contacts-page.tsx"
timestamp: 2026-10-07T06-52-46Z
slug: features-contacts-contacts-page-tsx
---

Method: dual-agent (A: fd6c8a68-9d40-45e6-a063-ada04036ab83 · B: 47f26267-2876-4574-9a4c-4b2ac4c1cb48)

#### Design Health Score

| #         | Heuristic                       |     Score | Key Issue                                             |
| --------- | ------------------------------- | --------: | ----------------------------------------------------- |
| 1         | Visibility of System Status     |         2 | Fake "Step 1 of 1"; DraftRestoreBar unused            |
| 2         | Match System / Real World       |         2 | List L/Cr vs form raw ₹; "Add exclusive owner" jargon |
| 3         | User Control and Freedom        |         2 | Back disabled; no live draft restore                  |
| 4         | Consistency and Standards       |         2 | Mobile vs Phone number; black Save vs green list CTAs |
| 5         | Error Prevention                |         3 | Duplicate phone + zod strong                          |
| 6         | Recognition Rather Than Recall  |         2 | Must convert L/Cr to digits; localities type-first    |
| 7         | Flexibility and Efficiency      |         2 | Save & add another helps; long outdoor scroll         |
| 8         | Aesthetic and Minimalist Design |         2 | List calm; drawer equal-weight Email/Source/Notes     |
| 9         | Error Recovery                  |         3 | Open existing / Continue anyway solid                 |
| 10        | Help and Documentation          |         2 | No help on budget units or "exclusive"                |
| **Total** |                                 | **22/40** | **Acceptable**                                        |

#### Design Specificity Verdict

**LLM assessment**: List is product-authored (Surat call roster, L/Cr budget hero, Call/WhatsApp). Sidebars are category-interchangeable SaaS drawers — fake wizard, raw ₹ budgets, black Save contact. Split personality.

**Deterministic scan**: detect --json on features/contacts and all four named files → exit 0, []. Zero rule hits. Issues are structural UX, not detector smells.

**Visual overlays**: Unavailable — no mutable browser injection; no healthy Next server. Fallback: CLI + user screenshots.

#### Overall Impression

The roster works. Opening Add buyer is the valley: fake Step 1 of 1, dead Back, and budget/localities — the list heroes — demoted to optional raw digits and type-to-add.

#### What's Working

1. List budget as brand hero — "Up to ₹60 L" / "Up to ₹6 Cr"
2. Labeled Call / WhatsApp on cards
3. Duplicate phone guard with Open existing / Continue anyway

#### Priority Issues

**[P1] Budget capture fights roster** — Budget min/max (₹) Optional vs L/Cr cards. Fix: Lakh/Crore control + live preview. → /impeccable clarify

**[P1] Fake wizard chrome** — Step 1 of 1 + disabled Back. Fix: drop stepper; Cancel + Save buyer/owner. → /impeccable distill

**[P1] Draft restore unused** — DraftRestoreBar exists but add modals never mount it. Fix: wire draft key on open. → /impeccable harden

**[P2] Owner jargon + broken edit** — "Add exclusive owner"; edit hard-fails. Fix: plain Add owner; hide Edit until API works. → /impeccable clarify

**[P2] Field noise + CTA mismatch** — Email/Source/Notes equal weight; black Save contact. Fix: More details collapse; brand-green Save buyer. → /impeccable layout

#### Persona Red Flags

**Casey**: long scroll; dead Back; no draft restore; digit budget outdoors.
**Jordan**: Step 1 of 1 confusion; Save contact ≠ Add buyer; exclusive owner unexplained.
**Surat field broker**: must invent 6000000 for "60 lakh"; no always-visible Vesu/Adajan chips; purple-ish avvatar shapes vs brief anti-goal.

#### Minor Observations

Double success toast · buyer Mobile vs owner Phone number · ChipPicker unused · owner five-field address wall · Notes "0 of 500" tall on phone.

#### Questions to Consider

1. Why ask Email/Source before the broker can type 60 + Lakh?
2. What does Step 1 of 1 protect — and why is Back a brick?
3. Tap Vesu/Adajan chips, or hunt type + +?
4. DraftRestoreBar exists — why still only a discard dialog?
