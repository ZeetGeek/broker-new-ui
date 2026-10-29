import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import { type NotificationItem, notificationsApi } from "@/lib/api/notifications";
import {
    isLaunchDestinationAllowed,
    isLaunchEventVisible,
} from "@/lib/notifications/launch-policy";

import { FEATURE_PLATFORM_OWNER } from "@/config";

test("broker launch hides deferred event types and owner destinations while retaining CRM events", () => {
    for (const type of [
        "representation_approved",
        "invite_received",
        "referral_rewarded",
        "request_approved",
        "team_joined",
    ]) {
        assert.equal(isLaunchEventVisible({ type }, false), false);
        assert.equal(isLaunchEventVisible({ type }, true), true);
    }
    for (const type of [
        "visit_requested",
        "visit_approved",
        "lead_added",
        "deal_closed",
        "offer_accepted",
        "property_sold",
    ]) {
        assert.equal(isLaunchEventVisible({ type, href: "/broker/visits" }, false), true);
    }
    assert.equal(
        isLaunchEventVisible({ type: "system", relatedRepresentationId: "old-request" }, false),
        false,
    );
    for (const href of [
        "/owner/properties",
        "/broker/owners/old",
        "/broker/my-deals",
        "/broker/referrals",
        "/broker/your-listings?tab=requests",
        "/broker/my-properties?tab=requests",
        "https://example.com",
        "//example.com",
        "/%6fwner/properties",
        "/bad%escape",
    ]) {
        assert.equal(isLaunchDestinationAllowed(href, false), false, href);
    }
    assert.equal(isLaunchDestinationAllowed("/broker/contacts/owner-contact", false), true);
});

test(
    "visible pagination and unread counts exclude deferred rows across API pages",
    { skip: FEATURE_PLATFORM_OWNER },
    async (t) => {
        const previous = api.defaults.adapter;
        t.after(() => {
            api.defaults.adapter = previous;
        });
        const row = (id: string, type: string, isRead = false) =>
            ({ id, type, isRead, href: "/broker/visits" }) as NotificationItem;
        const pages = [
            [row("hidden", "representation_request"), row("visit", "visit_approved")],
            [row("lead", "lead_added", true), row("reward", "referral_rewarded")],
        ];
        const marked: string[] = [];
        api.defaults.adapter = async (config) => {
            const url = new URL(config.url!, "https://qa.local");
            if (config.method === "patch") marked.push(url.pathname);
            const page = Number(url.searchParams.get("page") ?? 1);
            return {
                data: { page, limit: 2, total: 4, unreadCount: 3, items: pages[page - 1] ?? [] },
                status: 200,
                statusText: "OK",
                headers: {},
                config,
            };
        };
        const first = await notificationsApi.list({ page: 1, limit: 1 });
        assert.equal(first.total, 2);
        assert.equal(first.unreadCount, 1);
        assert.deepEqual(
            first.items.map((item) => item.id),
            ["visit"],
        );
        assert.deepEqual(
            (await notificationsApi.list({ page: 2, limit: 1 })).items.map((item) => item.id),
            ["lead"],
        );
        await notificationsApi.markAllRead();
        assert.deepEqual(marked, ["/notifications/visit/read"]);
    },
);
