# Empty States

Single source of truth for designing and writing empty states.
`.claude/rules/` and `.cursor/rules/` only point here.

Related: `docs/MESSAGES.md` (message copy), `docs/LOADING.md` (loading vs
empty), `docs/REUSE.md` (the shared `<EmptyState>` component).

---

## The principle

An empty state is not a notice that data is missing. It is the **first thing a
new user reads**, and often the only guidance they get. On a two-sided
marketplace being seeded by hand, every founding broker will see these screens
before they see anything else.

Treat each one as onboarding copy, not as an error.

Three jobs, in order:

1. **Reassure** — nothing is broken
2. **Explain** — what appears here, and where it comes from
3. **Direct** — the single next thing to do

---

## Never show a zero

Zero is a state, not a quantity. Counting nothing is cold and reads as
failure.

| ❌ | ✅ |
|---|---|
| 0 site visits, 0 requests waiting | No visits booked. No requests waiting. |
| 0 clients | No clients yet |
| 0 properties represented | You're not representing any properties yet |
| You have 0 follow-ups | Nothing due today |
| 0 new in your areas | No new properties in your areas this week |

**The exception:** a zero inside a progress or ratio is fine, because the
denominator gives it meaning — "0 of 5 photos uploaded", "Step 1 of 3". The
rule is about zero as a *standalone count*.

Better still, when everything is zero, **stop counting and say something
useful.** A summary line that adds up to nothing should be replaced, not
rendered.

---

## Three kinds — design differs, not just wording

| Kind | Situation | Design |
|---|---|---|
| **First-run** | Never had data | Icon + headline + one line + **primary button**. The most important one. |
| **Filtered** | Has data, filter hides it | No icon. Short line + **`Clear filters`**. Must never say "add your first…" |
| **Cleared** | Had data, now done | Quiet and positive. No button. Small, low-contrast. |

Getting this wrong is a bug. In the current dashboard, **"Nothing due. Nice."**
is written as a cleared state, but a brand-new broker has never had a follow-up
to clear. To them it reads as praise for nothing — slightly odd, and it teaches
them nothing about what follow-ups are.

For a new user that card should say what follow-ups *are*:

> **No follow-ups yet**
> Set a reminder to call a client back, and it'll show here.

---

## Anatomy

```
┌──────────────────────────────────┐
│                                  │
│   ◍   ← icon, 40px, muted, in    │
│         a soft tinted circle     │
│                                  │
│   No clients yet          ← h3   │
│   Add a buyer or tenant to       │
│   start tracking deals.   ← sm,  │
│                             muted│
│   [ Add client ]     ← ONE button│
│                                  │
└──────────────────────────────────┘
```

| Element | Rule |
|---|---|
| Icon | Single line icon, ~40px, muted, optional soft tinted circle behind it. Never a large illustration — it costs bytes on mobile data. |
| Headline | `text-h3`. States what's missing. No period on a fragment. |
| Body | One line, `text-body-sm`, muted. Says what appears here or what to do. Never two lines on mobile. |
| Action | **At most one** button per card. Others are text links. |
| Height | Collapses to content. See below. |
| Shadow | None — separation comes from the cream canvas against white cards. |
| Orange | Never. Orange is reserved for time pressure. |

### The ghost-preview variant

For lists whose *shape* is unfamiliar — the pipeline, the activity feed, the
requests list — a stronger pattern than an icon is a **faded ghost of one real
row**, at ~15% opacity, with a caption beneath.

It teaches what will appear there, which plain text cannot. Use it where the
layout itself is the thing the user needs to learn. Keep it to one or two ghost
rows, and mark it `aria-hidden`.

---

## Empty cards must collapse

In the current dashboard, the "Next Showing" card is roughly 370px tall with
content only at the very top and a button pinned at the bottom. The middle is
dead space, and it appears six times down the page.

**Rule: an empty card sizes to its content.** Do not reserve the height of the
loaded state. A `min-height` of around 160–180px is enough to stop it looking
broken.

This single change makes the whole first-run screen fit closer to one viewport
instead of three, which matters far more on a phone than a desktop.

---

## The wall-of-empty problem

Six empty cards stacked together is the real issue on the current dashboard.
Each message is fine in isolation; together they read as *"this app has nothing
in it."* That is the opposite of what a founding broker should feel on day one.

Three rules:

### 1. Never show two empty states that say the same thing

"Next Showing — Nothing on the calendar" and "Today · 31 Aug — Nothing
scheduled today" are adjacent cards saying the same thing twice. When both are
empty, **render one**.

### 2. Suppress or collapse what isn't actionable yet

A card the user cannot act on yet earns no space. When everything is empty,
show two or three cards, not six. Bring the rest back as data arrives.

### 3. Exactly one primary action on the screen

The current dashboard offers `Schedule a visit`, `Book a site visit`, `Browse
properties`, `Add a follow-up`, `Add client`, and `Browse` — six calls to
action with no hierarchy. A new broker cannot tell which comes first.

There is a correct order, and the screen should express it: **one solid button
for the single next step; everything else is a text link.**

---

## Blocked empty states — the most important case here

An empty state must never tell the user to do something they cannot yet do.

The current dashboard shows `Add RERA` and `No service areas` as small chips,
while the cards say **"Browse properties in your areas to send your first
request."** But there are no service areas set — so that action leads to a
second empty screen. And RERA verification gates what a broker can do at all.

When a prerequisite is missing, the empty state's job changes: it should ask
for the prerequisite, not the goal.

| Broker state | The card should say |
|---|---|
| `PROFILE_INCOMPLETE` | **Add your RERA number to get verified**<br>Owners approve verified brokers far more often.<br>`[Add RERA number]` |
| No service areas | **Tell us where you work**<br>We'll show you new properties in those areas.<br>`[Add service areas]` |
| `PENDING_VERIFICATION` | **Verification in progress**<br>You can browse and add clients now. We'll email you when it's approved.<br>— |
| `VERIFIED`, no data | The normal first-run empty state |

The setup path is the empty state until setup is done. Everything else waits.

---

## Copy patterns

Consistent shape across every surface: **headline names what's missing, body
explains where it comes from, action is one verb.**

| Surface | First-run empty |
|---|---|
| Next visit | **No visits booked**<br>Schedule one when a client is ready to see a property. |
| Today | **Nothing booked today**<br>Visits you schedule will appear here. |
| Requests | **No requests sent yet**<br>Find a property you'd like to sell and ask the owner. |
| Pipeline | **No clients yet**<br>Add a buyer or tenant to start tracking deals. |
| Follow-ups | **No follow-ups yet**<br>Set a reminder to call a client back, and it'll show here. |
| Activity | **Nothing yet**<br>Owner approvals, views, and updates will appear here. |
| You represent | **Not representing any properties yet**<br>Once an owner approves your request, the property appears here. |
| New in your areas | **Nothing new this week**<br>We'll show properties added in the areas you work in. |
| Owner: properties | **No properties yet**<br>Add your first one — it takes about 2 minutes. |
| Owner: requests | **No broker requests yet**<br>Brokers can see your property and ask to sell it. We'll let you know. |
| Browse, filtered | **No properties match these filters**<br>Try a wider budget or a different locality. |
| Search | **No results for "{query}"**<br>Check the spelling, or search by locality. |

---

## Tone

- **Plain and warm, never cute.** No "oops", "whoops", "uh-oh". A broker whose
  screen is empty is not in a playful mood.
- **Consistent punctuation.** The current dashboard mixes "Nothing on the
  calendar." with "No requests yet" and "No recent activity". Pick one: **no
  full stop on a headline fragment**, full stop on the body sentence.
- **Second person.** "You're not representing any properties yet."
- **Never apologise.** Nothing has gone wrong.
- **Never internal vocabulary.** "Request to represent" reads to an owner as
  "A broker wants to sell your property".
- **Time estimates build trust** where the action is small: "it takes about 2
  minutes". Only claim it if it's true.

---

## Consistent action treatment

The current dashboard uses a solid black button, a plain text link, and a text
link with an arrow — three treatments for the same tier of action.

| Tier | Treatment |
|---|---|
| The one primary action on the screen | Solid button |
| Secondary actions | Text link with a trailing chevron |
| Tertiary / informational | Plain text link |

Pick one arrow style and use it everywhere. `→` and `›` should not both appear
on one screen.

---

## Accessibility

- The empty state is the region's content — announce it with `aria-live="polite"`
  when it replaces a loading state
- Decorative icons and ghost previews: `aria-hidden="true"`
- The action must be a real `<button>` or `<Link>`, reachable by keyboard
- Muted body text still needs 4.5:1 contrast. "Muted" is a common place this
  quietly fails

---

## Never do

- ❌ A literal `0` as a standalone count in user-facing text
- ❌ "No data", "Nothing here", "N/A", or a blank box
- ❌ "Add your first property" when the user has properties and a filter is on
- ❌ A cleared-state message ("Nothing due. Nice.") shown to a first-run user
- ❌ Two adjacent empty cards saying the same thing
- ❌ More than one primary button on a screen
- ❌ An empty card reserving the full height of its loaded state
- ❌ A CTA the user cannot complete yet
- ❌ A large illustration — bytes on mobile data
- ❌ Orange in an empty state
- ❌ Mixed punctuation and mixed arrow styles across cards

---

## Concrete rewrite: the current broker dashboard

For a brand-new broker with no RERA and no service areas.

**Greeting** — stop counting when everything is zero:

```
❌  Mon, 31 Aug.  0 site visits, 0 requests waiting.
✅  Mon, 31 Aug.  Let's finish setting up your profile.
```

Then, once set up but with an empty day:

```
✅  Mon, 31 Aug.  No visits booked. No requests waiting.
```

And once there is real data, counting is finally correct:

```
✅  Mon, 31 Aug.  2 site visits. 1 request waiting.
```

**Cards** — six become three:

1. **Setup card** (primary, solid button) — Add RERA → service areas
2. **One combined visits card** — not "Next Showing" *and* "Today"
3. **Requests**, with the ghost-preview treatment so the shape is learnable

Pipeline, Follow-ups, and Activity collapse to a single quiet line each, or
wait until there is a client. They have nothing to teach a broker who has not
yet been verified.
