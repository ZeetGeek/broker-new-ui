# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The product serves two user roles in the Indian real-estate market: Owners and Brokers. Organization accounts may manage team members later, but team membership does not create another role. Buyers are offline contacts created and managed by brokers; they are not users and do not log in.

The first launch is in Surat. Users are generally non-technical and primarily use inexpensive Android phones, often while travelling between properties and reading the screen outdoors.

## Product Purpose

The product connects owner-supplied property inventory to a broker CRM without manual re-entry. Owners list properties, brokers request consent to represent them, and approved properties flow directly into the broker's pipeline. Success means this consent-gated loop works quickly and clearly on a phone.

## Positioning

One property record moves from the owner's live supply into the broker's working pipeline after representation approval; neither side has to retype it. Representation is bidirectional: a broker may request it, and an owner may invite a broker.

## Operating Context

Owners publish property visit slots. Brokers book those slots for one to three buyer contacts, request another time when necessary, manage their visit day, contact both parties, navigate between properties, and log outcomes that move buyers through the pipeline. Marketplace properties may require owner confirmation; broker-owned private listings are confirmed directly by the broker.

## Capabilities and Constraints

- Roles are only Owner and Broker. Account type (`individual` or `organization`) is a flag, not a role.
- The frontend is a Next.js App Router application. The NestJS, Prisma, and PostgreSQL backend is a separate repository and is accessed over HTTP.
- Store visit timestamps as UTC ISO strings and render them in `Asia/Kolkata`.
- Money is INR and is displayed using lakh/crore conventions.
- The initial product must work well in Surat on narrow, lower-powered Android devices.
- Representation is the consent-gated owner/broker relationship for one property.
- Deferred scope: team-management screens, payments, WhatsApp Business automation, in-app chat, ratings/reviews, AI features, and buyer-facing accounts.
- Open decisions: final product name and domain; the meaning/duration of “free”; exact pipeline stage names and count.

## Brand Commitments

“YesBroker” is a placeholder only. Runtime product naming must come from the existing centralized app/site configuration so the final name can be changed in one place. User-facing copy is direct, plain, sentence case, and avoids exposing internal enum language.

## Evidence on Hand

- Product constraints and vocabulary: `AGENTS.md`.
- Current design system and tokens: `docs/DESIGN.md` and `app/globals.css`.
- Approved Site visits specification: `C:\Users\ZEET\Downloads\yesbroker-site-visits-codex-prompt.md`.
- Existing broker/owner/contact, property, visit, pipeline, and shared UI components in this repository.
- No approved customer testimonials, commercial claims, pricing, or final brand assets are available; future work must not fabricate them.

## Product Principles

- Enter property data once and let it flow through consent into the broker workflow.
- Keep owner and buyer context visible together wherever a broker works a deal.
- Make frequent field actions fast, explicit, and trustworthy on a phone.
- Use plain language for users while preserving exact domain terms in the model.
- Preserve owner consent and make consequential state changes visible and reversible where possible.

## Accessibility & Inclusion

Primary flows need 44px or larger touch targets, high-contrast text suitable for outdoor use, keyboard and screen-reader support, non-colour status cues, and reduced-motion behavior. The interface must remain usable at 360px without page-level horizontal scrolling.
