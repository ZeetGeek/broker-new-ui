---
target: Contacts page (Buyers)
total_score: 22
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: "file:D:\\Projects\\Office\\broker-new-ui\\features\\contacts\\contacts-page.tsx"
target_fingerprint: "sha256:f7510da9c4e19b1966f54defba56ea5642069c55dc2ceea0f363697fe045e12e"
target_path: "D:\\Projects\\Office\\broker-new-ui\\features\\contacts\\contacts-page.tsx"
timestamp: 2026-10-07T04-02-40Z
slug: features-contacts-contacts-page-tsx
---

Method: dual-agent (A: 0a1ea8c4-1cbe-480d-8d37-937f6e1ef231 · B: 830d7a3f-8a20-4175-9316-2ca6032e9f3a)

#### Design Health Score

| #         | Heuristic                       | Score     | Key Issue                                                               |
| --------- | ------------------------------- | --------- | ----------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 3         | Tab counts + skeletons solid; priority is a mute unlabeled dot          |
| 2         | Match System / Real World       | 2         | Budgets as ₹M not lakh/crore; purple avatars feel imported SaaS         |
| 3         | User Control and Freedom        | 3         | Search/clear/panel exits exist; dual Add paths feel sticky              |
| 4         | Consistency and Standards       | 2         | Toolbar Add vs FAB; random pastel property tiles; purple breaks one-hue |
| 5         | Error Prevention                | 2         | Dense nested hit targets on each card invite outdoor mis-taps           |
| 6         | Recognition Rather Than Recall  | 3         | Tabs/sort labeled; Call/WhatsApp icon-only on touch                     |
| 7         | Flexibility and Efficiency      | 2         | Search/sort present; no bulk; FAB duplicates desktop Add                |
| 8         | Aesthetic and Minimalist Design | 1         | Buying chips + house stack + avatar noise dominate the scan             |
| 9         | Error Recovery                  | 3         | Load error + Try again; empty + Clear search                            |
| 10        | Help and Documentation          | 1         | No guidance for priority dots or Contacts vs Pipeline                   |
| **Total** |                                 | **22/40** | **Acceptable**                                                          |

#### Design Specificity Verdict

**LLM assessment**: Partially authored for YesBroker, mostly category-interchangeable. The two-tone headline, warm cream canvas, Buyers/Owners split, and +91 phones feel local. Purple Avvvatars initials, identical Buying chips, pastel house-icon stacks, dual Add CTAs, and ₹M budgets could ship on any Western CRM with a cream theme.

**Deterministic scan**: `impeccable detect --json features/contacts` exited 0 with `[]` — 0 findings across 20 files. Detector did not catch the purple-avatar / dual-CTA / density issues (visual/product problems outside its rules).

**Visual overlays**: No reliable user-visible overlay. Browser automation was not exposed in this session; live-server + detect.js injection was skipped.

#### Overall Impression

The page knows its job (find a buyer, call them) but dresses every contact like a busy dashboard widget. Biggest opportunity: make the card answer "who do I call next?" in one glance — name, locality, budget in L/Cr, last touch — and kill competing chrome.

#### What's Working

1. Two-tone, tab-aware headline correctly orients Buyers vs Owners.
2. Warm cream + white cards + brand-green accents hold the system when purple is not competing.
3. Real broker actions (Call, WhatsApp, attach, recency) match offline contact work.

#### Priority Issues

**[P1] Purple Avvvatars initials on every card**

- **Why**: DESIGN.md bans decorative purple; faces become the loudest pixel and kill one-hue trust.
- **Fix**: Brand-soft / brand-ink initials only.
- **Suggested command**: /impeccable colorize

**[P1] Dual Add CTAs (toolbar + FAB)**

- **Why**: Two primaries for the same job; FAB also offers Add owner on Buyers.
- **Fix**: One create affordance per breakpoint/context.
- **Suggested command**: /impeccable distill

**[P1] Card density — Buying chips + house-icon row**

- **Why**: Outdoor scan needs name → phone → urgency; redundant Buying and empty cover stacks burn attention.
- **Fix**: Demote/drop Buying on Buyers tab; collapse empty stack to one Attach line; one highlight for overdue.
- **Suggested command**: /impeccable quieter

**[P2] Budget as ₹M instead of lakh/crore**

- **Why**: Brokers think ₹60 L / ₹1.25 Cr; M forces mid-call translation.
- **Fix**: Compact Indian L/Cr on cards.
- **Suggested command**: /impeccable clarify

**[P2] Priority as color-only tiny dot**

- **Why**: Color-alone fails outdoors and for accessibility; tooltips die on touch.
- **Fix**: Text label or reserved urgent only when overdue.
- **Suggested command**: /impeccable harden

#### Persona Red Flags

**Alex**: No bulk; desktop FAB redundancy; edit/log-call path feels heavy.
**Jordan**: Buying on every Buyers card; unlabeled priority dots; unclear house tiles; two Add stories.
**Casey**: Icon-only Call/WhatsApp clusters; tall cards push Spoke below fold; purple + glare hurts glance recognition.

#### Minor Observations

- Frequent "Localities not set" reads as empty chrome.
- Two dot languages (priority vs status) compete.
- Nested interactive controls inside card button role is an a11y smell.
- Empty/error/skeleton paths exist in source and are structurally sound.

#### Questions to Consider

1. If Buyers already means buyer, should budget or overdue own the brand-soft chip instead of Buying?
2. Would a Surat broker recognize Ayush faster from a purple AY disc or from vesu · ₹60 L · Spoke 3d ago with no avatar?
3. Is the desktop FAB honest product language or leftover mobile pattern?
4. What if the primary job were "who do I call in the next ten minutes?" instead of browsing a directory?
