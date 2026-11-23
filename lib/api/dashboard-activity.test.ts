import assert from "node:assert/strict";
import test from "node:test";

import type { DashboardResponse } from "@/lib/api/dashboard";

import {
    Activity,
    Building2,
    CalendarCheck,
    Handshake,
    UserRound,
    UserRoundPlus,
    Users,
} from "@/components/shared/icons";

import { mapBrokerDashboardView } from "@/features/dashboard/map-dashboard";
import { activityIcon } from "@/features/new-dashboard/activity-icon";

test("dashboard activity keeps each item's category for its icon", () => {
    const data = {
        activity: {
            items: [
                {
                    id: "a1",
                    category: "calendar",
                    action: "visit_scheduled",
                    title: "Visit scheduled",
                    detail: "Priya Desai · Orchid Homes",
                    entityType: "showing",
                    entityId: "s1",
                    createdAt: "2026-11-23T09:10:00.000Z",
                    whenLabel: "20m ago",
                    href: "/broker/visits",
                    actorName: null,
                    actorAvatarUrl: null,
                },
            ],
            remainingCount: 0,
        },
    } as unknown as DashboardResponse;
    const view = mapBrokerDashboardView(data, null, new Date("2026-11-23T09:30:00.000Z"));
    assert.equal(view.activity.items[0]?.category, "calendar");
});

test("activity categories the backend writes get their own icons", () => {
    assert.equal(activityIcon("calendar"), CalendarCheck);
    assert.equal(activityIcon("clients"), UserRoundPlus);
    assert.equal(activityIcon("properties"), Building2);
    assert.equal(activityIcon("representation"), Handshake);
    assert.equal(activityIcon("team"), Users);
    assert.equal(activityIcon("profile"), UserRound);
});

test("unknown or missing categories fall back to the activity icon", () => {
    assert.equal(activityIcon("something_new"), Activity);
    assert.equal(activityIcon(undefined), Activity);
});
