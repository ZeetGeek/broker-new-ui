# Messages & Copy

Single source of truth for what the app *says* — errors, empty states,
validation, success, and not-found. `.claude/rules/` and `.cursor/rules/` only
point here.

Loading copy lives in `docs/LOADING.md`.

---

## Three principles

Users are property owners and brokers, not technical people. Phase 1 UI is
English, plain and short.

1. **Say what happened**, in words the user would use.
2. **Say what to do next.** A message with no next step is a dead end.
3. **Never blame the user.** "Enter a 10-digit mobile number," not "Invalid
   input."

Every message answers: *what happened → what now.* If it only does the first,
it isn't finished.

---

## Anatomy

```
[What happened]           Couldn't send your request.
[Why, if it helps]        Your internet connection dropped.
[What to do]              [Try again]
```

Keep it to one or two short sentences. Never a paragraph. Never a status code,
stack trace, endpoint, or table name.

---

## Choosing the channel

Picking the wrong surface is as damaging as bad wording.

| Channel | Use for | Never use for |
|---|---|---|
| **Inline field error** | Form validation on a specific field | Anything not tied to one field |
| **Form-level banner** | Submit failed as a whole | Field-specific problems |
| **Toast** | Transient success the user doesn't need to act on | Errors, anything requiring action, anything important |
| **Inline banner** | Persistent state — "Verification pending" | Momentary confirmations |
| **Full-page state** | 404, empty list, error boundary | Anything recoverable in place |
| **Modal** | Destructive confirmation | Information the user didn't ask for |

**Toasts are the most abused.** They vanish, they stack, and on a phone they're
easy to miss entirely while scrolling. A toast that says "Failed to save" is a
lost error. If the user must act, it goes inline and it stays.

---

## Errors — the mapping

The API speaks in status codes. The user must never see one.

| Situation | Message | Action |
|---|---|---|
| No connection | You're offline. Check your internet and try again. | Retry |
| Request timed out | This is taking too long. Try again. | Retry |
| 401 session expired | Your session expired. Please log in again. | Log in |
| 403 not allowed | You don't have access to this. | Back |
| 404 gone | This property is no longer available. | Browse properties |
| 409 conflict | You've already sent a request for this property. | View request |
| 422 validation | Please check the highlighted fields. | — (inline errors) |
| 429 rate limited | Too many attempts. Wait a minute and try again. | — |
| 500 server | Something went wrong on our side. Try again in a moment. | Retry |
| Unknown | Something went wrong. Try again. | Retry |

Two rules on top of the table:

- **Never leak internals.** No "PrismaClientKnownRequestError", no
  `/api/v1/representations`, no column names.
- **500 is our fault, and the wording should say so.** "Something went wrong on
  our side" is more honest and less alarming than a bare "Error".

### Preserve the user's work

If a submit fails, **the form keeps its data.** Losing a half-finished property
listing on a dropped connection is how someone stops using the app for good.

---

## Form validation

### Timing

- **Never** show an error before the user has touched the field
- Validate on **blur** the first time
- After a field has errored once, re-validate on **change** so the error clears
  as they fix it
- On submit: validate everything, focus the first invalid field

Errors that appear while someone is still typing their first character feel
accusatory and are the most common validation mistake.

### Wording

Say what's expected, not what's wrong.

| ❌ Don't | ✅ Do |
|---|---|
| Invalid input | Enter a 10-digit mobile number |
| This field is required | Enter the property's locality |
| Value must match pattern | PIN code should be 6 digits |
| Error in field | Price must be more than ₹0 |
| Min length not met | Add at least 20 characters so buyers know what to expect |

### India-specific rules

| Field | Rule | Message |
|---|---|---|
| Mobile | 10 digits, +91 | Enter a 10-digit mobile number |
| PIN code | 6 digits | PIN code should be 6 digits |
| Price | > 0, sensible range | Enter a price between ₹1 L and ₹100 Cr |
| Carpet area | > 0, less than built-up | Carpet area can't be more than built-up area |
| RERA number | State format | Enter your RERA registration number as it appears on your certificate |
| Photos | At least 1 to publish | Add at least one photo — listings with photos get far more interest |
| Available from | Not in the past | Choose today or a future date |

### Long forms

The property wizard is three steps. On submit failure:

- Show a summary at the top: "2 fields need attention"
- Mark which **step** has the problem, not just the field
- Move focus to the first invalid field
- Never silently fail on a step the user can't currently see

---

## Empty states — three kinds, often confused

Getting this wrong is a real bug, not a copy nitpick.

### 1. First-run empty — user has never had data

Teach. This is the most valuable screen in onboarding.

| Screen | Message |
|---|---|
| Owner, no properties | **No properties yet**<br>Add your first property — it takes about 2 minutes.<br>`[Add property]` |
| Broker, no clients | **No clients yet**<br>Add a client to start tracking their property search.<br>`[Add client]` |
| Broker, no representations | **You're not representing any properties yet**<br>Browse properties and send a request to the owner.<br>`[Browse properties]` |
| Owner, no requests | **No broker requests yet**<br>Brokers will see your property and can request to sell it. We'll notify you.<br>— |

### 2. Filtered empty — user *has* data, the filter excludes it

Completely different message. Offering "Add your first property" to someone
with twelve listings who filtered to ₹0–1 L is a bug.

> **No properties match these filters**
> Try widening your budget or choosing a different locality.
> `[Clear filters]`

Always offer the clear-filters escape. Always say the filters are the cause.

### 3. Cleared empty — there was data, and it's done

Positive, not apologetic.

> **All caught up**
> No pending requests right now.

### Rules

- Every empty state has an **icon, a headline, one line, and usually an action**
- Never "No data", "Nothing here", or an empty white box
- The headline says what's missing; the line says what to do

---

## Not found

### The WhatsApp dead-link case — specific to this product

Brokers share property links in WhatsApp. Those links sit in chat history
forever. When a property sells or is unpublished, someone will open that link
weeks later.

A generic "404 — Page Not Found" is the wrong answer for that person. They
followed a real link to a real property.

> **This property is no longer available**
> It may have been sold, rented, or taken down by the owner.
> `[Browse similar properties]`

Use `notFound()` and a route-level `not-found.tsx` for this, and keep the
`noindex` behaviour from `app/AGENTS.md` so the dead listing leaves search
results.

### Generic 404

> **Page not found**
> The link may be broken or the page may have moved.
> `[Go home]`

### Distinguish the reasons

"Doesn't exist," "was deleted," and "you can't see this" are three different
situations. Where it's safe to say which, say it. Where revealing it would leak
information about another user's data, fall back to the generic not-found —
never confirm a record exists to someone not allowed to see it.

---

## Success messages

**Only confirm what isn't already visible.** If the UI updates to show the
result, a toast is noise.

| Action | Toast? | Message |
|---|---|---|
| Property published | ✅ | Property published. Brokers can now see it. |
| Request sent to owner | ✅ | Request sent. The owner will be notified. |
| Request approved | ✅ | Approved. The property is now in your pipeline. |
| Photo uploaded | ❌ | The thumbnail appearing is the confirmation |
| Client moved a stage | ❌ | The card moved — that's the confirmation |
| Filter changed | ❌ | The list changed |
| Profile saved | ✅ | Changes saved. |

Good success copy says **what happens next**, not just that something worked.
"Request sent" is fine. "Request sent. The owner will be notified." is better,
because it answers the question the user was about to ask.

---

## Destructive confirmations

Name the thing. Say the consequence. Put the verb on the button.

> **Delete this property?**
> "3 BHK in Vesu" will be removed permanently. Brokers currently representing
> it will be notified.
> `[Cancel]` `[Delete property]`

- ❌ "Are you sure?" — sure about what?
- ❌ "OK" / "Yes" — the button must name the action
- ✅ State whether it can be undone
- ✅ Mention who else is affected — other people's work is attached to these
     records

---

## Words to avoid

Internal vocabulary is not user vocabulary.

| ❌ Internal | ✅ Shown to users |
|---|---|
| Request to represent | Broker wants to sell your property |
| Representation | Working with this broker |
| Pipeline / CRM | My clients |
| Site visit slot | Visit time |
| Validation failed | Please check the highlighted fields |
| Unauthorized | You don't have access to this |
| Submit | Save / Send / Publish (say which) |
| Entity / record / row | Property / client / request |

Also avoid: "oops", "uh-oh", "whoops". Cute error copy reads as unserious when
someone's listing just failed to save.

---

## Where message strings live

Repeated and mapped strings go in `config/messages.ts`:

- The HTTP-status → message map above
- Validation messages (shared with the zod schemas in `lib/validation/`)
- Domain confirmations that appear in more than one place

One-off page copy can stay inline. Do not build an i18n system yet.

**Why this matters beyond tidiness:** the Hindi/regional toggle is a Phase 2
item. If every user-facing string is buried in JSX, that migration means
touching every file. Centralising the repeated ones now costs nothing and makes
the later job tractable.

Validation messages in particular should live **with the zod schema**, so the
form and the API-error path produce identical wording. Two sources of the same
message always drift.

---

## Never do

- ❌ A status code, stack trace, endpoint, or table name shown to a user
- ❌ A toast for an error the user must act on
- ❌ "No data", "Nothing here", or a blank white box as an empty state
- ❌ "Add your first property" when the user has properties and a filter is on
- ❌ A generic 404 for a sold or unpublished property
- ❌ Validation errors before the field is touched
- ❌ "Are you sure?" with an "OK" button
- ❌ Losing form input on a failed submit
- ❌ Confirming a record exists to someone not allowed to see it
- ❌ A message with no next step

---

## Before shipping a screen

- [ ] Every failure path has a message naming what happened and what to do
- [ ] Errors mapped from status codes, never shown raw
- [ ] Empty state distinguishes first-run from filtered
- [ ] Validation fires on blur, clears on fix, and says what's expected
- [ ] Success only where the result isn't already visible
- [ ] Destructive actions name the object and the consequence
- [ ] No internal vocabulary anywhere the user can read
- [ ] Form data survives a failed submit
