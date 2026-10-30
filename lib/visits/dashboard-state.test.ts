import assert from "node:assert/strict";
import test from "node:test";

import type { DashboardResponse, DashboardVisit } from "@/lib/api/dashboard";
import { pipelineStageFromQuery } from "@/lib/properties/pipeline-stage-query";
import { agendaVisitState, isActiveDashboardVisit } from "@/lib/visits/dashboard-state";

import { mapBrokerDashboardView } from "@/features/dashboard/map-dashboard";

test("dashboard stage links normalize the existing API and UI vocabulary", () => {
    for (const [input, expected] of [
        ["site_visit", "visit"],
        ["visit", "visit"],
        ["offer_made", "negotiation"],
        ["negotiation", "negotiation"],
        ["new", "new"],
        ["contacted", "contacted"],
    ]) {
        assert.equal(pipelineStageFromQuery(input), expected);
    }
    for (const invalid of [null, "", "invented", "closed_won"])
        assert.equal(pipelineStageFromQuery(invalid), null);
});

test("a passed start time does not complete a confirmed or unconfirmed visit", () => {
    const start = new Date("2026-10-29T08:00:00Z");
    const now = new Date("2026-10-29T09:00:00Z");
    assert.equal(agendaVisitState("confirmed", start, now), "elapsed");
    assert.equal(agendaVisitState("pending", start, now), "elapsed");
    assert.equal(agendaVisitState("completed", start, now), "done");
    assert.equal(agendaVisitState("cancelled", start, now), "cancelled");
    assert.equal(agendaVisitState("no_show", start, now), "missed");
    for (const status of ["completed", "cancelled", "cancelled_by_owner", "no_show", "expired"])
        assert.equal(isActiveDashboardVisit(status), false);
});

test("agenda counts use persisted statuses and Next showing omits terminal visits", () => {
    const now = new Date("2026-10-29T09:00:00Z");
    const upcomingVisits = ["completed", "cancelled", "no_show", "confirmed", "pending"].map(
        (status, index) =>
            ({
                id: status,
                status,
                scheduledAt: `2026-10-29T0${index + 4}:00:00Z`,
                propertyTitle: "Office in Surat",
                statusLabel: "",
                clientName: "Buyer",
            }) as DashboardVisit,
    );
    const view = mapBrokerDashboardView(
        { upcomingVisits, summary: {}, charts: {} } as DashboardResponse,
        null,
        now,
    );
    assert.equal(view.today.doneCount, 1);
    assert.equal(view.today.remainingCount, 2);
    assert.equal(view.today.items.find((item) => item.id === "confirmed")?.state, "elapsed");
    assert.match(
        view.today.items.find((item) => item.id === "pending")?.subtitle ?? "",
        /Start time passed/,
    );
    assert.equal(view.nextShowing?.id, "confirmed");
});
