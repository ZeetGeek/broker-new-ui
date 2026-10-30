import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
    BROKER_ADD_BUYER_HREF,
    BROKER_ADD_DEAL_HREF,
    BROKER_VISIT_SLOTS_HREF,
    brokerVisitHref,
} from "@/lib/routes/broker";

const source = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("broker workflow links use implemented Contacts and Visits query parameters", () => {
    const buyer = new URL(BROKER_ADD_BUYER_HREF, "https://qa.local");
    assert.equal(buyer.pathname, "/broker/contacts");
    assert.equal(buyer.searchParams.get("add"), "buyer");
    const deal = new URL(BROKER_ADD_DEAL_HREF, "https://qa.local");
    assert.equal(deal.pathname, "/broker/contacts");
    assert.equal(deal.searchParams.get("flow"), "add-deal");
    const slots = new URL(BROKER_VISIT_SLOTS_HREF, "https://qa.local");
    assert.equal(slots.pathname, "/broker/visits");
    assert.equal(slots.searchParams.get("tab"), "slots");
    const visitId = "visit/one?&another=value";
    const visit = new URL(brokerVisitHref(visitId), "https://qa.local");
    assert.equal(visit.pathname, "/broker/visits");
    assert.equal(visit.searchParams.get("tab"), "visits");
    assert.equal(visit.searchParams.get("visit"), visitId);
    assert.equal(visit.searchParams.has("another"), false);
});

test("pipeline actions and old new URL reach the buyer-linking flow rather than the gated marketplace", () => {
    for (const path of [
        "features/pipeline/pipeline-empty.tsx",
        "features/pipeline/pipeline-column.tsx",
    ]) {
        const text = source(path);
        assert.match(text, /BROKER_ADD_DEAL_HREF/);
        assert.doesNotMatch(text, /BROKER_MY_DEALS_HREF/);
    }
    const route = source("app/(role)/broker/pipeline/[id]/page.tsx");
    assert.match(route, /id === "new"/);
    assert.match(route, /redirect\("\/broker\/contacts\?add=buyer"\)/);
    assert.match(route, /initialLeadId=\{id\}/);
    assert.doesNotMatch(route, /Timeline, follow-ups, and WhatsApp go here/);
    assert.match(source("features/pipeline/pipeline-page.tsx"), /openLeadView\(initialLeadId\)/);
    assert.match(
        source("app/(role)/broker/contacts/page.tsx"),
        /initialAddBuyer=\{query.add === "buyer"\}/,
    );
});

test("account menu and broker shortcuts no longer expose unimplemented destinations", () => {
    const menu = source("features/broker/profile-menu.tsx");
    assert.match(menu, /\/broker\/profile#profile-rera/);
    assert.doesNotMatch(menu, /Preview public profile|\/broker\/verification|\/b\//);
    const shell = source("features/dashboard/broker-portal-shell.tsx");
    assert.doesNotMatch(shell, /\/broker\/settings/);
    assert.match(shell, /\["settings"\]/);
});
