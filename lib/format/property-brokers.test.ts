import assert from "node:assert/strict";
import test from "node:test";

import type { RepresentationItem } from "@/lib/api/representative";
import { summarizePropertyBrokers } from "@/lib/format/property-brokers";

const now = Date.parse("2026-10-14T10:00:00Z");
function representation(overrides: Partial<RepresentationItem> = {}): RepresentationItem {
    return {
        id: "rep-1",
        propertyId: "property-1",
        brokerId: "broker-1",
        brokerName: "Ravi Patel",
        status: "accepted",
        ...overrides,
    };
}

test("counts accepted brokers separately from invitations and requests", () => {
    const summary = summarizePropertyBrokers(
        [
            representation(),
            representation({
                id: "rep-2",
                brokerId: "broker-2",
                status: "pending",
                initiatedBy: "owner",
            }),
            representation({
                id: "rep-3",
                brokerId: "broker-3",
                status: "pending",
                initiatedBy: "broker",
            }),
        ],
        now,
    ).get("property-1")!;
    assert.deepEqual(
        summary.brokers.map((broker) => broker.id),
        ["broker-1"],
    );
    assert.deepEqual(
        summary.pendingInvitations.map((broker) => broker.id),
        ["broker-2"],
    );
    assert.deepEqual(
        summary.pendingRequests.map((broker) => broker.id),
        ["broker-3"],
    );
});

test("excludes revoked, withdrawn, rejected, expired and unidentified relationships", () => {
    const rows = ["revoked", "withdrawn", "rejected"].map((status) => representation({ status }));
    rows.push(
        representation({ endsAt: "2026-10-14T10:00:00Z" }),
        representation({ endsAt: "2026-10-13T10:00:00Z" }),
        representation({ endsAt: "invalid-date" }),
        representation({ brokerId: undefined }),
        representation({ propertyId: "" }),
    );
    assert.equal(summarizePropertyBrokers(rows, now).size, 0);
});

test("deduplicates each property's brokers with accepted consent taking precedence", () => {
    const rows = [
        representation({ id: "pending", status: "pending", initiatedBy: "owner" }),
        representation({
            id: "accepted",
            brokerDisplayName: "Ravi Realty",
            brokerAvatarUrl: "/ravi.jpg",
        }),
        representation({ id: "duplicate" }),
        representation({ id: "other-property", propertyId: "property-2" }),
    ];
    const summary = summarizePropertyBrokers(rows, now);
    assert.deepEqual(summary.get("property-1"), {
        brokers: [{ id: "broker-1", name: "Ravi Realty", avatarUrl: "/ravi.jpg" }],
        pendingInvitations: [],
        pendingRequests: [],
    });
    assert.equal(summary.get("property-2")?.brokers.length, 1);
    assert.equal(rows[0].id, "pending");
});

test("retains future consent and falls back to organization names", () => {
    const summary = summarizePropertyBrokers(
        [
            representation({
                endsAt: "2026-10-15T10:00:00Z",
                brokerName: " ",
                brokerOrgName: "Surat Realty",
            }),
        ],
        now,
    );
    assert.equal(summary.get("property-1")?.brokers[0].name, "Surat Realty");
});
