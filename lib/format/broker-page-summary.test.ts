import assert from "node:assert/strict";
import { test } from "node:test";

import { buildEarningsReport } from "@/features/earnings/earnings-math";
import { MOCK_DEALS } from "@/features/pipeline/mock-deals";
import { taskSchema } from "@/features/tasks/model";

import {
    contactsSummary,
    dashboardSummary,
    earningsSummary,
    historySummary,
    listingsSummary,
    pipelineSummary,
    profileSummary,
    tasksSummary,
    visitsSummary,
} from "./broker-page-summary";

const now = new Date("2026-11-26T12:00:00.000Z");
const inventory = {
    total: 17,
    published: 12,
    draft: 3,
    unpublished: 2,
    sold: 0,
    sale: 10,
    rent: 4,
};
const people = {
    buyerCount: 8,
    unmatchedBuyerCount: 3,
    ownerCount: 6,
    lapsedOwnerCount: 1,
    platformOwnerCount: 4,
    customOwnerCount: 2,
};

test("unavailable dashboard queries do not become zero counts or an all-caught-up claim", () => {
    const rows = dashboardSummary({
        overdue: null,
        activeDeals: null,
        visitsToday: null,
        visitsToUpdate: null,
    });
    assert.equal(rows.length, 1);
    assert.doesNotMatch(rows[0].text, /\b0\b|up to date|No overdue/);
});

test("client matches come from the summary, and owner-only facts stay in the owners view", () => {
    const rows = contactsSummary(people, "buyers", false);
    assert.equal(rows[0].mobile, "8 clients saved");
    assert.ok(rows.some((row) => row.mobile === "3 clients to match"));
    assert.ok(rows.some((row) => row.mobile === "5 clients linked to property"));
    assert.ok(rows.every((row) => !row.text.includes("owner")));
    assert.equal(contactsSummary(null, "buyers", false).length, 0);
    assert.ok(
        contactsSummary(people, "owners", false).every(
            (row) => !/representation|platform/.test(row.text),
        ),
    );
    assert.ok(
        contactsSummary(people, "owners", true).some((row) =>
            /no active representation/.test(row.text),
        ),
    );
});

test("listing search and archived tabs do not rotate unrelated inventory totals", () => {
    const rows = listingsSummary({
        summary: inventory,
        resultTotal: 1,
        status: "published",
        hasActiveFilters: true,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].text, "1 listing matches your filters");
    assert.ok(
        listingsSummary({
            summary: inventory,
            resultTotal: 2,
            status: "deleted",
            hasActiveFilters: false,
        }).every((row) => !/draft|sale|rent/.test(row.text)),
    );
    assert.ok(
        listingsSummary({
            summary: inventory,
            resultTotal: 12,
            status: "published",
            hasActiveFilters: false,
        }).some((row) => /across your inventory/.test(row.text)),
    );
});

test("pipeline keeps stage facts available for rotation and scopes to supplied deals", () => {
    const deal = MOCK_DEALS[0];
    const rows = pipelineSummary([{ ...deal, status: "negotiation" }], "board", true);
    assert.match(rows[0].text, /1 deal matches your filters/);
    assert.ok(rows.some((row) => /Negotiation/.test(row.text)));
    assert.ok(rows.some((row) => /1 client/.test(row.text)));
});

test("visit summaries distinguish the selected view from other statuses", () => {
    const rows = visitsSummary(
        { upcoming: 0, running: 1, needs_update: 2, completed: 4, not_attended: 0, cancelled: 1 },
        "upcoming",
        true,
    );
    assert.equal(rows[0].mobile, "No visits in this view");
    assert.ok(rows.some((row) => row.mobile === "2 visits to update"));
    assert.ok(rows.every((row) => !/today|all time/i.test(row.text)));
});

test("completed and deleted task tabs do not announce unrelated overdue work", () => {
    const task = taskSchema.parse({
        id: "t1",
        title: "Call client",
        details: "",
        dueDate: "2026-11-20",
        dueTime: null,
        reminders: [],
        deliveredReminderKeys: [],
        clientId: null,
        propertyId: null,
        completedAt: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        priority: "high",
    });
    const tasks = [
        task,
        { ...task, id: "t2", completedAt: now.toISOString() },
        { ...task, id: "t3", deletedAt: now.toISOString() },
    ];
    assert.ok(
        tasksSummary(tasks, "all", now.getTime(), false, 1).some((row) => /overdue/.test(row.text)),
    );
    assert.deepEqual(
        tasksSummary(tasks, "completed", now.getTime(), false, 1).map((row) => row.mobile),
        ["1 task completed"],
    );
    assert.deepEqual(
        tasksSummary(tasks, "deleted", now.getTime(), false, 1).map((row) => row.mobile),
        ["1 task in Deleted"],
    );
    assert.deepEqual(
        tasksSummary(tasks, "all", now.getTime(), true, 0).map((row) => row.mobile),
        ["No matching tasks"],
    );
});

test("history summaries label partial category and date counts as loaded records", () => {
    const rows = historySummary({
        entries: [{ category: "Visits", createdAt: now.toISOString() }],
        notifications: true,
        total: 100,
        now,
        filtered: false,
    });
    assert.ok(rows.some((row) => row.text === "100 notifications in your history."));
    assert.ok(rows.some((row) => row.text === "1 loaded notification from today."));
    assert.ok(rows.some((row) => row.text === "1 loaded notification in visits."));
    assert.ok(rows.every((row) => !/read|up to date/.test(row.text)));
    const filtered = historySummary({
        entries: [],
        notifications: true,
        total: 100,
        unreadCount: 42,
        now,
        filtered: true,
    });
    assert.ok(filtered.every((row) => !/100|42/.test(row.text)));
});

test("profile summaries omit absent metrics and reflect unsaved or saving state", () => {
    assert.equal(profileSummary(null, false, false).length, 0);
    const rows = profileSummary(
        {
            fullName: "Broker",
            broker: { serviceAreas: ["Surat", "Surat", " "], experienceYears: 0 },
        },
        true,
        false,
    );
    assert.equal(rows[0].mobile, "You have unsaved changes");
    assert.ok(rows.some((row) => row.mobile === "1 service area saved"));
    assert.ok(rows.every((row) => !/verified|rating|closed deal/.test(row.text)));
    assert.equal(profileSummary({}, true, true).length, 1);
});

test("earnings report uses estimated commission and omits unavailable rates", () => {
    const report = buildEarningsReport([], { preset: "all_time" }, (key) => key, now);
    const rows = earningsSummary(report);
    assert.ok(rows.some((row) => /estimated commission/.test(row.text)));
    assert.ok(rows.every((row) => !/win rate|on average|Up |Down /.test(row.text)));
});

test("each fact has distinct short mobile wording suitable for the narrow header", () => {
    const rows = [
        ...dashboardSummary({
            overdue: 12,
            activeDeals: 23,
            visitsToday: 4,
            visitsToUpdate: 5,
            listings: inventory,
        }),
        ...contactsSummary(people, "buyers", false),
        ...listingsSummary({
            summary: inventory,
            resultTotal: 12,
            status: "published",
            hasActiveFilters: false,
        }),
        ...visitsSummary(
            {
                upcoming: 12,
                running: 2,
                needs_update: 3,
                completed: 42,
                not_attended: 4,
                cancelled: 5,
            },
            "completed",
            false,
        ),
        ...profileSummary(
            {
                isEmailVerified: true,
                broker: {
                    serviceAreas: ["Surat"],
                    specializations: ["Apartment"],
                    experienceYears: 7,
                },
            },
            false,
            false,
        ),
    ];
    for (const row of rows) {
        assert.ok(row.text.length > 0);
        assert.ok(row.mobile.length > 0 && row.mobile.length <= 38, row.mobile);
    }
});
