import assert from "node:assert/strict";
import test from "node:test";

import type { BookableLead, BrokerVisit } from "@/lib/api/site-visits";
import { matchWorkflowVisitIntent, resolveWorkflowVisitIntent } from "@/lib/visits/workflow-intent";

const leads: BookableLead[] = [
    {
        leadId: "lead-1",
        clientId: "client-1",
        clientName: "Rahul",
        propertyId: "property-1",
        propertyTitle: "Home",
    },
    {
        leadId: "lead-2",
        clientId: "client-2",
        clientName: "Ravi",
        propertyId: "property-1",
        propertyTitle: "Home",
    },
];

test("a client context prefills its only eligible open deal", () => {
    assert.equal(matchWorkflowVisitIntent({ clientId: "client-1" }, leads)?.leadId, "lead-1");
    assert.deepEqual(resolveWorkflowVisitIntent({ clientId: "client-1" }, leads, null), {
        kind: "schedule",
        intent: leads[0],
        intentMissed: false,
    });
});

test("a property context never chooses arbitrarily between two clients", () => {
    assert.equal(matchWorkflowVisitIntent({ propertyId: "property-1" }, leads), null);
    assert.deepEqual(resolveWorkflowVisitIntent({ propertyId: "property-1" }, leads, null), {
        kind: "schedule",
        intent: null,
        intentMissed: false,
    });
});

test("one eligible property-context match prefills, while ineligible records stay unavailable", () => {
    assert.equal(
        matchWorkflowVisitIntent({ propertyId: "property-1" }, leads.slice(0, 1))?.leadId,
        "lead-1",
    );
    assert.deepEqual(resolveWorkflowVisitIntent({ clientId: "not-bookable" }, leads, null), {
        kind: "schedule",
        intent: null,
        intentMissed: true,
    });
    assert.equal(matchWorkflowVisitIntent({}, leads), null);
});

test("prefilled context reschedules only the same eligible deal's exclusive active visit", () => {
    const active = { id: "visit-1", leadId: "lead-1", isExclusive: true } as BrokerVisit;
    assert.deepEqual(resolveWorkflowVisitIntent({ clientId: "client-1" }, leads, active), {
        kind: "reschedule",
        visit: active,
    });
    assert.equal(
        resolveWorkflowVisitIntent({ clientId: "client-1" }, leads, {
            ...active,
            leadId: "unrelated",
        }).kind,
        "schedule",
    );
    assert.equal(
        resolveWorkflowVisitIntent({ clientId: "client-1" }, leads, {
            ...active,
            isExclusive: false,
        }).kind,
        "schedule",
    );
});
