---
target: contacts page + add buyer/owner sidebars
total_score: 20
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\contacts\\contacts-page.tsx"
target_fingerprint: "sha256:9e1585864e80ba14c0f083bd9b751c09f0c370f201a82647052be7379af86517"
target_path: "D:\\Projects\\Office\\broker-new-ui\\features\\contacts\\contacts-page.tsx"
timestamp: 2026-10-07T06-38-20Z
slug: features-contacts-contacts-page-tsx
---

Method: dual-agent (A: 4d98d40e-9e14-4767-a3e8-676d80163d7a · B: f7f3d023-2913-455a-9d45-0263831e4754)

#### Design Health Score

| #         | Heuristic                       |     Score | Key Issue                                                                          |
| --------- | ------------------------------- | --------: | ---------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     |         3 | Busy/duplicate feedback solid; "Step 1 of 1" fakes multi-step progress             |
| 2         | Match System / Real World       |         2 | Cards speak L/Cr; form asks raw ₹; "Save contact" after "Add buyer"                |
| 3         | User Control and Freedom        |         2 | Back permanently disabled at step 0; only X / discard-confirm exits                |
| 4         | Consistency and Standards       |         2 | Add owner vs Add exclusive owner; Mobile vs Phone number; black Save vs green CTAs |
| 5         | Error Prevention                |         3 | Duplicate phone check excellent; optional budget still yields "Budget not set"     |
| 6         | Recognition Rather Than Recall  |         2 | Localities need type+Add; Surat chips hidden until typing                          |
| 7         | Flexibility and Efficiency      |         2 | Save & add another helps; draft restore unused — mid-call abandon loses work       |
| 8         | Aesthetic and Minimalist Design |         1 | Wizard chrome + ~11 equal-weight fields; crowded footer                            |
| 9         | Error Recovery                  |         2 | Inline alerts OK; owner edit hard-stops as unavailable                             |
| 10        | Help and Documentation          |         1 | Subcopy only; no help on budget units or localities outdoors                       |
| **Total** |                                 | **20/40** | **Acceptable**                                                                     |

#### Design Specificity Verdict

**LLM assessment**: Split personality. The Contacts list is product-authored (brand-green Buyers/Owners, ₹ L/Cr budget hero, Surat areas, Call/WhatsApp). The Add buyer / Add owner drawers are category-interchangeable CRM chrome: fake wizard shell, raw ₹ budgets, native selects, black Save. Surat locality data exists but is hidden behind type-to-add.

**Deterministic scan**: `impeccable detect --json features/contacts` (and narrower modal/form targets) exited 0 with `[]` — 0 rule hits. No detector disagreement with the design review; the issues are structural UX, not pattern-detector smells.

**Visual overlays**: No reliable user-visible overlay. Browser automation with mutable script injection was unavailable; no healthy Next.js server was running. Fallback: CLI scan only + user-provided screenshots.

#### Overall Impression

The roster works for "who do I call next." Opening Add buyer drops the broker into a dense, one-step "wizard" that fights the phone-call capture job — especially budget and localities, which should be the form's heroes and instead feel optional/hostile outdoors.

#### What's Working

1. List thesis holds: brand green on tabs/WhatsApp/budget; Call + WhatsApp pair; no dual Add on one breakpoint.
2. Duplicate phone UX is product-grade (match name/type + Open existing / Continue anyway).
3. India phone hygiene: digit clamp, +91 hint, 6–9 validation.

#### Priority Issues

**[P0] Fake wizard shell (Back + Step 1 of 1)**

- **What**: Single-step drawers still show progress UI and a permanently disabled Back.
- **Why it matters**: Outdoor thumb hits a dead control; "Step 1 of 1" burns trust before any field.
- **Fix**: Drop step chrome for single-page forms; replace Back with Cancel (or close); keep discard confirm when dirty.
- **Suggested command**: /impeccable distill

**[P1] Budget entry fights the roster hero**

- **What**: Cards show "Up to ₹60 L"; form is optional Budget min/max in raw ₹ with no L/Cr readback.
- **Why it matters**: Brokers think in lakh/crore; empty budget ships useless "Budget not set" cards.
- **Fix**: Lakh/Crore toggle + spoken preview; require max for Buy; mirror card copy.
- **Suggested command**: /impeccable clarify

**[P1] Preferred localities UX is hostile outdoors**

- **What**: Required locality field = type + +; Surat suggestions only after draft text.
- **Why it matters**: Between site visits, Vesu/Adajan should be one tap.
- **Fix**: Show top Surat chips immediately; free-text as overflow; require ≥1 chip.
- **Suggested command**: /impeccable adapt

**[P1] Field order + required friction (buyer)**

- **What**: Email early; Source required; Buy/Rent muted; call-order fields buried.
- **Why it matters**: Phone-call capture order is Name → phone → Buy/Rent → budget → area → BHK.
- **Fix**: Reorder to call transcript; demote Email/Source/Notes; Source optional or silent Walk-in default.
- **Suggested command**: /impeccable layout

**[P2] Footer actions + owner parity**

- **What**: Black Save contact; owner titled "Add exclusive owner"; heavier address wall; edit path errors out.
- **Why it matters**: Primary CTA should be thumb-zone brand green; owner form is less finishable.
- **Fix**: Full-width brand primary; align owner title; progressive-disclose address; don't open doomed Edit.
- **Suggested command**: /impeccable harden

#### Persona Red Flags

**Casey (Distracted Mobile)**: Long scroll after FAB; cramped footer; dead Back; localities need type+Add; draft restore unused — WhatsApp interrupt wipes progress.

**Jordan (First-Timer)**: Step 1 of 1 implies a wizard with no next step; Save contact vs Add buyer mismatch; exclusive owner jargon unexplained.

**Surat broker between site visits**: Needs ~20s capture; form asks Email, Source*, dual budgets; budget optional → useless card; localities don't surface Vesu/Adajan as first-class taps; owner demands society/address before call-roster use case.

#### Minor Observations

- Notes hint "N of 500" vs schema max 300
- Double success toast path possible
- Buy/Rent segment not brand-green
- Owner Source optional vs buyer Source required
- Good intent subcopy buried under wizard chrome

#### Questions to Consider

1. If the broker just hung up at a Vesu site, what is the minimum field set that still produces a callable card with a real budget?
2. Why perform a wizard for a form that refuses to have steps?
3. Should Add owner capture a person to call, or a listing to attach?
4. If budget is the hero of every buyer card, how is Optional on both budget fields still acceptable?
