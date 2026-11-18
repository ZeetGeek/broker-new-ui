---
target: broker earnings page
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
target_identity: "file:D:\\PROJECTS\\OFFICE\\broker-new-ui\\app\\(role)\\broker\\earnings\\page.tsx"
target_fingerprint: "sha256:52e83f5a8a43a732400ec14d80ceba36e6ea338636fd34da0786807e441ea74d"
target_path: "D:\\PROJECTS\\OFFICE\\broker-new-ui\\app\\(role)\\broker\\earnings\\page.tsx"
timestamp: 2026-11-17T19-05-27Z
slug: app-role-broker-earnings-page-tsx
---
Method: dual-agent (A: 2edc7872-c36a-45fd-9a40-dc5dd0da32a0 · B: c4dc91fe-89a3-4404-b455-327dc284d5c1)

#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|------:|-----------|
| 1 | Visibility of System Status | 3 | On ~360px the earned total sits under header + range picker + 2×2 stat strip |
| 2 | Match System / Real World | 2 | FY/₹ fit India; "Win rate", radial gauge, stacked charts are analyst language |
| 3 | User Control and Freedom | 3 | URL period + deal links work; 10 period presets with no progressive disclosure |
| 4 | Consistency and Standards | 1 | Multi-hue charts (sky/amber/violet) vs one-green DESIGN; hero gradient/shadow |
| 5 | Error Prevention | 2 | Estimate copy helps; hero still reads like banked cash; sample data can be trusted |
| 6 | Recognition Rather Than Recall | 3 | Chart conventions + hover tooltips are phone-hostile |
| 7 | Flexibility and Efficiency | 3 | Power-user depth; first visit overloaded |
| 8 | Aesthetic and Minimalist Design | 1 | Same story thrice (sale/rent, sold/lost); six cards after the strip |
| 9 | Error Recovery | 3 | Load error + empty CTAs are solid |
| 10 | Help and Documentation | 2 | Real rules buried in footer body-xs; info icons not expandable |
| **Total** | | **23/40** | Needs work |

#### Design Specificity Verdict

**LLM assessment**: Category-interchangeable SaaS analytics shell with authored India/CRM footnotes. INR formatting, FY presets, estimate framing, and deal deep-links are product-specific; the composition (KPI strip → dual charts → leaderboards → loss taxonomy) could be any CRM earnings page. Lime hero total is the only strongly product-owned moment; multi-hue chart bars erase the one-green system.

**Deterministic scan**: `impeccable detect --json features/earnings` and route folder → exit 0, **0 findings**. Browser overlay inject succeeded but on `/login` after auth redirect; one `bounce-easing` warning on `body` from shared `transitions-dev.css`, not earnings markup — treat as false positive for this target.

**Visual overlays**: Overlay ran in a fresh tab but only on the login gate (auth wall). No reliable earnings-page overlay is available without a signed-in session. CLI scan of the feature is clean.

#### Overall Impression

Honest money framing and India-native periods are strong; the page still withholds the ₹ answer under a dashboard encyclopedia. Biggest opportunity: one green, above-the-fold money answer (period + ₹ + estimate caveat + next action), demote charts/duplicates/loss autopsy.

#### What's Working

1. Estimate framing + unvalued-commission notes + footer basis rules (sale final/offer/ask; rent brokerage).
2. India-native periods (`this_fy` / `last_fy`) and commission formatting.
3. DeltaPill direction in words; empty/error copy is plain and actionable.

#### Priority Issues

1. **[P0] Money below the fold on 360px**
   - Why: Dark attention pattern requires the critical metric first; StatStrip precedes Hero.
   - Fix: Mobile order = period → hero total → thin outcomes → rest secondary.
   - Suggested command: `/impeccable layout` then `/impeccable adapt`

2. **[P0] Multi-hue charts vs one-green product**
   - Why: DESIGN forbids second brand hues on charts; hero hardcodes sky/amber; open deals use violet.
   - Fix: Green depth + pattern/label only; flat `bg-brand-deep`; one token source.
   - Suggested command: `/impeccable distill` (or `/impeccable quieter`)

3. **[P1] Duplicate narrative modules**
   - Why: Hero sale/rent ≈ trend stack; strip sold/lost ≈ sold-vs-lost chart.
   - Fix: One sale/rent breakdown; demote sold/lost chart behind disclosure.
   - Suggested command: `/impeccable distill`

4. **[P1] Peak-end ends on losses + legalese**
   - Why: Session should end on next action, not autopsy.
   - Fix: End with pipeline CTA; move Losses behind "Review losses"; pin estimate help near total.
   - Suggested command: `/impeccable clarify` + `/impeccable layout`

5. **[P2] Period preset overload (10 options)**
   - Why: Phone outdoors cannot scan 10 periods.
   - Fix: Default 3–4 (This month / Last 3 / This FY / Custom).
   - Suggested command: `/impeccable distill`

#### Persona Red Flags

**Non-technical Indian broker (cheap Android, outdoors)**: Tiny footnotes; tooltip charts; multi-hue glare; money buried under four KPIs; 10-period sheet unusable one-handed.

**First-timer / empty pipeline**: Sample ₹ trains wrong trust; "Win rate" / radial gauge teach jargon before the core loop.

**Broker asking "did I get paid?"**: No blunt "estimated commission — not a payout" next to the total; disclaimer loses to bank-balance hero number.

#### Minor Observations

- Hero ignores `VIZ_ON_DARK` comment; hardcoded fills.
- Skeleton freezes wrong mobile priority (strip before hero).
- Stat strip "None" vs bare 0 is good EMPTY_STATES discipline.
- Auth-gated live UI not captured in automation; source critique is complete.

#### Questions to Consider

- If the only job is "₹ earned this period," why withhold that number on the first screenful?
- Why do earnings charts inherit pipeline stage hues?
- Would cutting the trend card make brokers more confident?
- Should the hero title be "Estimated commission — not a payout"?
