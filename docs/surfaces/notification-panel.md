# Notification panel

## Direction contract

**Thesis:** A quiet inbox for property work, with readable messages and clear next actions.

**Theme:** Existing warm surfaces, ink typography, warm separators, card radius, and soft popup shadow. Icons are bundled Iconify Tabler glyphs from the shared registry, without background tiles. Semantic icon colors and green date labels bring the theme into the list. Active filters are white with a warm border; row hover uses the same muted warm surface as property menus.

**Hierarchy:** Notification heading and mark-all-read action; compact category filters; date-grouped messages; separate footer with a brand-colored Button link to all notifications.

**Content:** Titles carry unread emphasis and a small dot. Descriptions wrap naturally. Property context remains secondary. The received date appears once in each group heading; the exact received timestamp is available in the row title. Repeated title prefixes are removed from API descriptions, with visit details retained. Accept/decline actions preserve existing consent logic.

**Responsive behavior:** Panel width is capped at 23rem; width and height respect the viewport and available popup space. The message list uses a bounded native scroll viewport with touch scrolling and scroll containment; the footer never covers a message. Filters support arrow, Home, and End keys.

**Verification:** ESLint, formatting, notification launch-policy tests, and TypeScript checks. Browser inspection requires a connected authenticated preview; no browser was available in this session.

## Motion

Uses transitions-dev recipes 05 (origin-aware dropdown), 16 (sliding white tab indicator), and 03 (unread badge). Open uses 250ms; close uses 150ms. Filter results use the existing short tab-panel reveal and reset the list to its start. First paint and resize position the tab indicator without animation. All effects honor reduced motion; row hover continues to change only the background.
