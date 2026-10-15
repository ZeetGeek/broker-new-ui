---
version: 1
slug: "app-role-owner-brokers-page-tsx"
primary_target: "app/(role)/owner/brokers/page.tsx"
related_targets:
    [
        "features/owner-brokers/owner-brokers-page.tsx",
        "features/owner-brokers/browse-broker-card.tsx",
        "features/owner-brokers/active-broker-card.tsx",
    ]
---

# Owner Brokers

## Mode

Operate

## Audience and job

Surat property owner on a phone. Needs to find a broker to invite, or open someone already representing a listing — same calm roster language as broker Contacts.

## Outcome

Scan brokers like contacts: count-led headline, Browse / My Brokers chips, dense tiles with one brand hero metric, Invite (or Call) as the single accent action.

## Direction contract

THESIS: Owner Brokers is the Contacts roster mirrored for owners — people-first tiles, not a marketplace directory wall or property-deal card grid.

OWN-WORLD: Warm cream canvas, white contact-card surfaces (shadow-md), brand green hero line and accent Invite; Verified as brand-soft chip. No trust banner card; consent lives in the muted headline clause.

STORY: Owner lands, reads count + meaning, switches Browse / My Brokers, filters quietly, taps Invite or Call without decoding dual equal CTAs.

FIRST VIEWPORT: Contacts-style two-tone H1. Sticky Browse / My Brokers chips + search (+ sort on Active). Optional filter chips. 1→2→3→4→5 grid of contact-density broker tiles: avatar, name, brand hero (experience / listing price), locality, outline View + accent Invite (Browse) or Call / WhatsApp (Active).

FORM: Brief-pinned Contacts parity (user: make owner brokers look like broker contacts). Signature move: Invite is the sole filled primary on browse cards.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Scope

Owner brokers list chrome, browse cards, active broker cards, empty/loading. Profile and invite dialogs keep behavior; visual quieting only where shared.

## Anti-goals

No TrustNote banner. No equal dual primaries. No Active tab as OwnerRequestCard property chrome. No inventing new brand hues.
