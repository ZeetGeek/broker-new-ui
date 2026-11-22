import assert from "node:assert/strict";
import test from "node:test";

import { closeDirectVisitHref, directVisitWorkflow } from "@/lib/visits/direct-workflow";

test("direct and refreshed visit URLs preserve the exact selected record and mode", () => {
    for (const mode of ["detail", "reschedule", "outcome"] as const) {
        const query = new URLSearchParams({ view: mode, visit: "visit/one?&", tab: "completed" });
        const target = directVisitWorkflow(query);
        assert.equal(target?.kind, "visit");
        assert.equal(target?.mode, mode);
        assert.equal(target?.id, "visit/one?&");
        assert.equal(target?.preview, false);
    }
});

test("preview direct links retain the read-only marker instead of becoming live visits", () => {
    const target = directVisitWorkflow(
        new URLSearchParams("view=reschedule&visit=visit-5&preview=true"),
    );
    assert.equal(target?.preview, true);
    assert.equal(target?.id, "visit-5");
    assert.equal(directVisitWorkflow(new URLSearchParams("view=detail")), null);
});

test("direct record routing leaves the list and existing schedule flow alone", () => {
    for (const query of [
        "",
        "tab=completed",
        "view=schedule",
        "schedule=1&leadId=lead-1",
        "view=unknown&visit=visit-1",
    ]) {
        assert.equal(directVisitWorkflow(new URLSearchParams(query)), null);
    }
    assert.equal(directVisitWorkflow(new URLSearchParams("visit=visit-1"))?.mode, "detail");
});

test("explicit contextual scheduling uses the same safe prefill workflow as ordinary clicks", () => {
    for (const [key, value] of [
        ["clientId", "client-1"],
        ["propertyId", "property-1"],
        ["leadId", "lead-1"],
    ] as const) {
        const params = new URLSearchParams({ view: "schedule", [key]: value, search: "kept" });
        const target = directVisitWorkflow(params);
        assert.equal(target?.mode, "schedule");
        assert.equal(target?.intent[key], value);
        const closed = new URL(closeDirectVisitHref(params), "https://qa.local");
        assert.equal(closed.searchParams.has("view"), false);
        assert.equal(closed.searchParams.get("search"), "kept");
        assert.equal(closed.searchParams.get(key), value);
    }
    assert.equal(directVisitWorkflow(new URLSearchParams("view=schedule")), null);
    assert.equal(directVisitWorkflow(new URLSearchParams("schedule=1&leadId=lead-1")), null);
});

test("closing a direct visit preserves unrelated list parameters and never mutates the source", () => {
    const original = new URLSearchParams(
        "view=detail&visit=visit-1&preview=true&tab=completed&search=Rahul&clientId=c1&sort=start_desc&tag=a&tag=b",
    );
    const href = new URL(closeDirectVisitHref(original), "https://qa.local");
    assert.equal(href.pathname, "/broker/visits");
    assert.equal(href.searchParams.has("view"), false);
    assert.equal(href.searchParams.has("visit"), false);
    assert.equal(href.searchParams.has("preview"), false);
    assert.equal(href.searchParams.get("tab"), "completed");
    assert.equal(href.searchParams.get("search"), "Rahul");
    assert.equal(href.searchParams.get("clientId"), "c1");
    assert.equal(href.searchParams.get("sort"), "start_desc");
    assert.deepEqual(href.searchParams.getAll("tag"), ["a", "b"]);
    assert.equal(original.get("visit"), "visit-1");
    assert.equal(
        closeDirectVisitHref(new URLSearchParams("view=detail&visit=visit-1")),
        "/broker/visits",
    );
});
