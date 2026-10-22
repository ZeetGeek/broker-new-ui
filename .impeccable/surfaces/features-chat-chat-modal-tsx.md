# Representation chat

Mode: Operate. Redesign the existing conversation only; preserve the representation API, permissions, attachments, and shared dialog implementation. The user supplied the visual direction and requested the existing green theme.

## Direction contract

THESIS: A compact conversation with a clear recipient, soft bubbles, and a generous two-row composer, following the supplied chat references.

OWN-WORLD: Existing warm neutral surfaces, brand-soft outgoing messages, brand-green send action, shared avatars and Tabler icons. Message surfaces use the installed shadcn Bubble and BubbleContent primitives adapted to existing tokens. No new global design tokens.

STORY: Identify the person, read the conversation, then send text or an attachment. Empty, loading, and closed threads remain clear.

FIRST VIEWPORT: A 32rem-wide portrait dialog with a compact recipient header, independently scrolling white message area, and a bordered white composer pinned below. Peer bubbles sit left beside avatars; outgoing bubbles sit right. Quiet date markers separate days. Message actions use the existing menu primitive and reveal on hover/focus for fine pointers while remaining visible on touch devices.

FORM: User-pinned reference, implemented directly as a local component redesign. No concept seed; palette and global modal are fixed by the brief. Meeting schedules, polls, reactions, and unsupported server actions are outside this change.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Empty conversation

The user requested an ImageGen illustration in place of the small empty-state icon. The final flat artwork uses pale mint, cream, and green on a white background and is stored in `public/illustrations/chat-empty-conversation.png`. The original generation prompt is recorded in `.impeccable/assets/chat-empty-conversation.prompt.md`. The shared AppImage component delivers responsive sizes. A short heading and property-specific invitation sit beneath the illustration; no new actions, tokens, or shared dialog changes are introduced.
