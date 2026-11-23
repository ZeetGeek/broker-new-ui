import assert from "node:assert/strict";
import test from "node:test";

import {
    type BrokerVisit,
    siteVisitsApi,
    type VisitListPage,
    type VisitListQuery,
} from "@/lib/api/site-visits";

const counts: VisitListPage["counts"] = {
    upcoming: 0,
    running: 0,
    needs_update: 0,
    completed: 0,
    not_attended: 0,
    cancelled: 0,
};
const page = (items: BrokerVisit[] = [], current = 1, pages = 1): VisitListPage => ({
    items,
    page: current,
    totalPages: pages,
    total: items.length,
    counts,
    clientOptions: [],
    propertyOptions: [],
    nextChangeAt: null,
});

test("visit lookup finds an exact ID on a later page of complete finished history", async (t) => {
    const previous = siteVisitsApi.list;
    t.after(() => {
        siteVisitsApi.list = previous;
    });
    const requests: Array<[VisitListQuery["tab"], number]> = [];
    const controller = new AbortController();
    siteVisitsApi.list = async (query, signal) => {
        assert.equal(signal, controller.signal);
        assert.equal(query.from, undefined);
        assert.equal(query.to, undefined);
        assert.equal(query.search, undefined);
        assert.equal(query.clientId, undefined);
        assert.equal(query.limit, 100);
        requests.push([query.tab, query.page!]);
        if (query.tab !== "completed") return page();
        return page(
            [{ id: query.page === 2 ? "correct" : "another-persons-visit" } as BrokerVisit],
            query.page,
            2,
        );
    };
    assert.equal((await siteVisitsApi.get("correct", controller.signal))?.id, "correct");
    assert.deepEqual(requests, [
        ["upcoming", 1],
        ["running", 1],
        ["needs_update", 1],
        ["completed", 1],
        ["completed", 2],
    ]);
});

test("missing visits inspect every supported tab once and never return another record", async (t) => {
    const previous = siteVisitsApi.list;
    t.after(() => {
        siteVisitsApi.list = previous;
    });
    const visited: VisitListQuery["tab"][] = [];
    siteVisitsApi.list = async (query) => {
        visited.push(query.tab);
        return page([{ id: "similar" } as BrokerVisit]);
    };
    assert.equal(await siteVisitsApi.get("missing"), null);
    assert.deepEqual(visited, [
        "upcoming",
        "running",
        "needs_update",
        "completed",
        "not_attended",
        "cancelled",
    ]);
});

test("lookup failures remain retryable errors instead of being reported as missing", async (t) => {
    const previous = siteVisitsApi.list;
    t.after(() => {
        siteVisitsApi.list = previous;
    });
    let calls = 0;
    siteVisitsApi.list = async () => {
        calls += 1;
        throw new Error("Offline");
    };
    await assert.rejects(siteVisitsApi.get("saved-visit"), /Offline/);
    assert.equal(calls, 1);
});

test("abort signals stop both future pages and a just-completed obsolete lookup", async (t) => {
    const previous = siteVisitsApi.list;
    t.after(() => {
        siteVisitsApi.list = previous;
    });
    const controller = new AbortController();
    let calls = 0;
    siteVisitsApi.list = async () => {
        calls += 1;
        controller.abort();
        return page([{ id: "saved-visit" } as BrokerVisit]);
    };
    await assert.rejects(siteVisitsApi.get("saved-visit", controller.signal), {
        name: "AbortError",
    });
    assert.equal(calls, 1);
    await assert.rejects(siteVisitsApi.get("saved-visit", controller.signal), {
        name: "AbortError",
    });
    assert.equal(calls, 1);
});

test("blank IDs perform no requests and mismatched pagination cannot loop", async (t) => {
    const previous = siteVisitsApi.list;
    t.after(() => {
        siteVisitsApi.list = previous;
    });
    const requested: VisitListQuery[] = [];
    siteVisitsApi.list = async (query) => {
        requested.push(query);
        return page([], 1, 3);
    };
    assert.equal(await siteVisitsApi.get("  "), null);
    assert.equal(requested.length, 0);
    await assert.rejects(siteVisitsApi.get("saved-visit"), /requested visit page/);
    assert.deepEqual(
        requested.map((query) => query.page),
        [1, 2],
    );
});
