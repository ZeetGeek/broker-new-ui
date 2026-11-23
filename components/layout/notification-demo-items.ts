/**
 * DESIGN-ONLY sample notifications for the header dropdown.
 *
 * Used while `USE_DEMO_NOTIFICATIONS` is on in `portal-notifications-menu.tsx`.
 * Only shapes the broker launch really sends: `visit_reminder` and
 * `task_reminder`, in the server's `<what…> · <lead time> · <day, time>` body
 * format (see `features/tasks/reminder-toast.ts`). One visit fires several
 * reminders (1 day / 1 hour / at visit time), as `features/new-site-visits` allows.
 * Delete this file (and the flag) once the real feed is wired back in.
 */

import type { NotificationItem } from "@/lib/api/notifications";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type DemoSeed = {
    id: string;
    kind: "visit" | "task";
    body: string;
    isRead: boolean;
    agoMs: number;
};

const SEEDS: DemoSeed[] = [
    // Today
    {
        id: "demo_01",
        kind: "visit",
        body: "3 BHK · Happy Elegance with Aarav Shah · In 30 min · Today, 4:00 PM",
        isRead: false,
        agoMs: 4 * MINUTE,
    },
    {
        id: "demo_02",
        kind: "task",
        body: "Call Rahul about the Vesu shortlist · Follow up · At due time · Today, 3:30 PM",
        isRead: false,
        agoMs: 12 * MINUTE,
    },
    {
        id: "demo_03",
        kind: "visit",
        body: "3 BHK · Happy Elegance with Aarav Shah · In 1 hour · Today, 4:00 PM",
        isRead: false,
        agoMs: 34 * MINUTE,
    },
    {
        id: "demo_04",
        kind: "task",
        body: "Send the brochure to Neha Shah · Share documents · In 15 min · Today, 2:45 PM",
        isRead: false,
        agoMs: 58 * MINUTE,
    },
    {
        id: "demo_05",
        kind: "visit",
        body: "2 BHK · Orchid Homes with Priya Desai · At visit time · Today, 1:30 PM",
        isRead: true,
        agoMs: 2 * HOUR,
    },
    {
        id: "demo_06",
        kind: "visit",
        body: "Office · Business Centre with Rahul Mehta and 1 more · In 15 min · Today, 11:45 AM",
        isRead: true,
        agoMs: 4 * HOUR,
    },

    // Yesterday
    {
        id: "demo_07",
        kind: "visit",
        body: "3 BHK · Happy Elegance with Aarav Shah · In 1 day · Tomorrow, 4:00 PM",
        isRead: true,
        agoMs: 25 * HOUR,
    },
    {
        id: "demo_08",
        kind: "task",
        body: "Collect ID proof from Amit Trivedi · Before token payment · At due time · Today, 11:00 AM",
        isRead: true,
        agoMs: 28 * HOUR,
    },
    {
        id: "demo_09",
        kind: "visit",
        body: "4 BHK · Palm Residency with Ananya Shah · In 30 min · Today, 10:30 AM",
        isRead: true,
        agoMs: 30 * HOUR,
    },

    // Earlier this week
    {
        id: "demo_10",
        kind: "task",
        body: "Share the price list with Neha Shah · Follow up · In 1 hour · Today, 5:00 PM",
        isRead: true,
        agoMs: 3 * DAY,
    },
    {
        id: "demo_11",
        kind: "visit",
        body: "Plot · Dumas Road with Kiran Joshi · At visit time · Today, 10:00 AM",
        isRead: true,
        agoMs: 4 * DAY,
    },
    {
        id: "demo_12",
        kind: "task",
        body: "Retake photos for Orchid Homes · Listing upkeep · At due time · Today, 9:00 AM",
        isRead: true,
        agoMs: 5 * DAY,
    },
];

/** Builds the demo feed relative to `now` so the day groups and "2h" labels stay realistic. */
export function buildDemoNotifications(now: Date): NotificationItem[] {
    return SEEDS.map(({ id, kind, body, isRead, agoMs }) => ({
        id,
        userId: "demo_user",
        actorUserId: null,
        type: kind === "visit" ? "visit_reminder" : "task_reminder",
        title: kind === "visit" ? "Visit reminder" : "Task reminder",
        body,
        href:
            kind === "visit"
                ? "/broker/visits"
                : `/broker/tasks?view=detail&task=${encodeURIComponent(`task_${id}`)}`,
        referenceType: kind,
        referenceId: kind === "task" ? `task_${id}` : `visit_${id}`,
        relatedPropertyId: null,
        relatedRepresentationId: null,
        relatedLeadId: null,
        metadata: null,
        representationStatus: null,
        isRead,
        readAt: null,
        createdAt: new Date(now.getTime() - agoMs).toISOString(),
    }));
}
