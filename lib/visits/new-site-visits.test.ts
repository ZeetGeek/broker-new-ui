import assert from "node:assert/strict";
import test from "node:test";

import {
    draftTimes,
    EMPTY_DRAFT,
    getVisitActions,
    notificationKind,
    type SiteVisit,
    validateDraft,
    visitReminderAt,
    visitReminderLabel,
    visitReminders,
    visitState,
} from "@/features/new-site-visits/model";
import {
    PREVIEW_CLIENTS,
    PREVIEW_PROPERTIES,
    visitPreviewStore,
} from "@/features/new-site-visits/preview-store";

const draft = {
    ...EMPTY_DRAFT,
    clientId: "client",
    propertyId: "property",
    date: "2030-01-02",
    startTime: "10:00",
    endTime: "11:00",
};
const now = Date.parse("2030-01-01T00:00:00Z");
const visit: SiteVisit = {
    id: "visit",
    clientId: "client",
    propertyId: "property",
    startsAt: "2030-01-02T04:30:00Z",
    endsAt: "2030-01-02T05:30:00Z",
    status: "scheduled",
    reminders: [30],
    notes: "",
    attendanceNote: "",
    history: [],
};

test("visit times use IST regardless of the device timezone", () => {
    assert.deepEqual(draftTimes(draft), {
        startsAt: "2030-01-02T04:30:00.000Z",
        endsAt: "2030-01-02T05:30:00.000Z",
    });
    assert.equal(draftTimes({ ...draft, date: "2030-02-30" }), null);
    assert.equal(draftTimes({ ...draft, startTime: "25:00" }), null);
});

test("clock boundaries derive running and needs-update without overwriting attendance", () => {
    assert.equal(visitState(visit, Date.parse(visit.startsAt) - 1), "upcoming");
    assert.equal(visitState(visit, Date.parse(visit.startsAt)), "running");
    assert.equal(visitState(visit, Date.parse(visit.endsAt)), "needs_update");
    for (const status of ["completed", "not_attended", "cancelled"] as const) {
        assert.equal(visitState({ ...visit, status }, Date.parse(visit.endsAt) + 1), status);
    }
    assert.equal(visit.status, "scheduled");
});

test("actions follow each visit state and allow outcome corrections only after recording attendance", () => {
    assert.deepEqual(getVisitActions(visit, Date.parse(visit.startsAt) - 1), ["edit", "cancelled"]);
    for (const at of [Date.parse(visit.startsAt), Date.parse(visit.endsAt)]) {
        assert.deepEqual(getVisitActions(visit, at), ["edit", "completed", "cancelled"]);
    }
    assert.deepEqual(getVisitActions({ ...visit, status: "completed" }, now), [
        "edit",
        "not_attended",
        "delete",
    ]);
    assert.deepEqual(getVisitActions({ ...visit, status: "not_attended" }, now), [
        "edit",
        "completed",
        "delete",
    ]);
    assert.deepEqual(getVisitActions({ ...visit, status: "cancelled" }, now), ["view"]);
});

test("recorded visits can correct past times without becoming future appointments", () => {
    const afterVisit = Date.parse(visit.endsAt) + 60_000;
    for (const status of ["completed", "not_attended"] as const) {
        const recorded = { ...visit, status };
        assert.equal(
            validateDraft(
                { ...draft, startTime: "09:00", endTime: "10:00" },
                [recorded],
                afterVisit,
                recorded.id,
            ).valid,
            true,
        );
        assert.equal(
            validateDraft({ ...draft, date: "2030-01-03" }, [recorded], afterVisit, recorded.id)
                .valid,
            false,
        );
    }
});

test("overlapping appointments block saves, but touching boundaries and rescheduling self do not", () => {
    assert.equal(validateDraft(draft, [visit], now).errors.conflict, "visit");
    assert.equal(
        validateDraft({ ...draft, startTime: "10:30", endTime: "11:30" }, [visit], now).valid,
        false,
    );
    assert.equal(
        validateDraft({ ...draft, startTime: "11:00", endTime: "12:00" }, [visit], now).valid,
        true,
    );
    assert.equal(validateDraft(draft, [visit], now, "visit").valid, true);
    for (const status of ["completed", "not_attended", "cancelled"] as const) {
        assert.equal(validateDraft(draft, [{ ...visit, status }], now).valid, true);
    }
});

test("incomplete, past and reversed times are rejected", () => {
    assert.equal(validateDraft(EMPTY_DRAFT, [], now).valid, false);
    assert.equal(validateDraft({ ...draft, endTime: "10:00" }, [], now).valid, false);
    assert.equal(validateDraft({ ...draft, endTime: "09:00" }, [], now).valid, false);
    assert.equal(validateDraft(draft, [], Date.parse(visit.startsAt)).valid, false);
});

test("editing a running or ended visit can keep its time, but moving it requires a future time", () => {
    for (const editingNow of [Date.parse(visit.startsAt), Date.parse(visit.endsAt)]) {
        assert.equal(
            validateDraft(
                { ...draft, notes: "Updated meeting point" },
                [visit],
                editingNow,
                visit.id,
            ).valid,
            true,
        );
        assert.equal(
            validateDraft(
                { ...draft, startTime: "09:00", endTime: "10:00" },
                [visit],
                editingNow,
                visit.id,
            ).valid,
            false,
        );
        assert.equal(
            validateDraft({ ...draft, date: "2030-01-03" }, [visit], editingNow, visit.id).valid,
            true,
        );
    }
});

test("optional reminder advances to start and attendance; terminal visits suppress notifications", () => {
    assert.equal(notificationKind(visit, Date.parse(visit.startsAt) - 31 * 60_000), null);
    assert.equal(notificationKind(visit, Date.parse(visit.startsAt) - 30 * 60_000), "reminder");
    assert.equal(
        notificationKind({ ...visit, reminders: [] }, Date.parse(visit.startsAt) - 1),
        null,
    );
    assert.equal(notificationKind(visit, Date.parse(visit.startsAt)), "start");
    assert.equal(notificationKind(visit, Date.parse(visit.endsAt)), "attendance");
    for (const status of ["completed", "not_attended", "cancelled"] as const) {
        assert.equal(notificationKind({ ...visit, status }, Date.parse(visit.endsAt)), null);
    }
});

test("visit changes survive storage reloads and invalid links do not overwrite saved visits", async () => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "sessionStorage", {
        configurable: true,
        value: {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        },
    });
    try {
        const record: SiteVisit = {
            ...visit,
            clientId: PREVIEW_CLIENTS[0].id,
            propertyId: PREVIEW_PROPERTIES[0].id,
        };
        await visitPreviewStore.save("test-account", [record]);
        assert.deepEqual(await visitPreviewStore.list("test-account"), [record]);

        const updated = {
            ...record,
            notes: "Meet at reception",
            reminders: [1440, 90, 15, 0],
            status: "completed" as const,
            attendanceNote: "Client attended",
        };
        await visitPreviewStore.save("test-account", [updated]);
        assert.deepEqual(await visitPreviewStore.list("test-account"), [updated]);
        for (const reminders of [[30, 30], [-1], [1.5], [365 * 1440 + 1]]) {
            await assert.rejects(
                visitPreviewStore.save("test-account", [{ ...updated, reminders }]),
            );
            assert.deepEqual(await visitPreviewStore.list("test-account"), [updated]);
        }

        const corrected = { ...updated, status: "not_attended" as const };
        await visitPreviewStore.save("test-account", [corrected]);
        assert.equal((await visitPreviewStore.list("test-account"))[0].status, "not_attended");
        await visitPreviewStore.save("test-account", [updated]);

        await assert.rejects(
            visitPreviewStore.save("test-account", [
                { ...updated, propertyId: "missing-property" },
            ]),
        );
        assert.deepEqual(await visitPreviewStore.list("test-account"), [updated]);
        await visitPreviewStore.save("test-account", []);
        assert.deepEqual(await visitPreviewStore.list("test-account"), []);

        const { reminders: _reminders, ...legacy } = record;
        const key = [...storage.keys()][0];
        storage.set(
            key,
            JSON.stringify({
                version: 2,
                visits: [
                    { ...legacy, reminderMinutes: 30 },
                    { ...legacy, id: "legacy-without-reminder", reminderMinutes: 0 },
                ],
            }),
        );
        const migrated = await visitPreviewStore.list("test-account");
        assert.deepEqual(
            migrated.map((item) => item.reminders),
            [[30], []],
        );
        const stored = JSON.parse(storage.get(key)!);
        assert.equal(stored.version, 3);
        assert.equal("reminderMinutes" in stored.visits[0], false);
        assert.deepEqual(await visitPreviewStore.list("test-account"), migrated);
    } finally {
        if (previous) Object.defineProperty(globalThis, "sessionStorage", previous);
        else Reflect.deleteProperty(globalThis, "sessionStorage");
    }
});

test("multiple and custom visit reminders keep distinct IST instants and readable labels", () => {
    const reminders = visitReminders({ ...visit, reminders: [0, 15, 90, 1440, 90] });
    assert.deepEqual(
        reminders.map(({ minutes, at }) => ({ minutes, at })),
        [
            { minutes: 1440, at: "2030-01-01T04:30:00.000Z" },
            { minutes: 90, at: "2030-01-02T03:00:00.000Z" },
            { minutes: 15, at: "2030-01-02T04:15:00.000Z" },
            { minutes: 0, at: "2030-01-02T04:30:00.000Z" },
        ],
    );
    assert.equal(new Set(reminders.map((item) => item.key)).size, 4);
    assert.equal(visitReminderLabel(90), "1 hour 30 minutes before");
    assert.equal(visitReminderLabel(0), "At visit time");
    assert.equal(visitReminderAt(visit.startsAt, -1), null);
    assert.equal(visitReminderAt(visit.startsAt, 0.5), null);
    assert.equal(visitReminderAt("invalid", 30), null);
});

test("visit reminder validation rejects duplicates, invalid offsets and newly expired reminders", () => {
    assert.equal(validateDraft({ ...draft, reminders: [1440, 90, 15, 0] }, [], now).valid, true);
    for (const reminders of [[15, 15], [-1], [1.5], [365 * 1440 + 1]]) {
        assert.ok(validateDraft({ ...draft, reminders }, [], now).errors.reminders);
    }
    const beforeStart = Date.parse(visit.startsAt) - 10 * 60_000;
    assert.ok(validateDraft({ ...draft, reminders: [15] }, [], beforeStart).errors.reminders);
    assert.equal(
        validateDraft({ ...draft, reminders: [30] }, [visit], beforeStart, visit.id).valid,
        true,
    );
    assert.ok(
        validateDraft({ ...draft, reminders: [60] }, [visit], beforeStart, visit.id).errors
            .reminders,
    );
    assert.equal(
        validateDraft({ ...draft, reminders: [] }, [visit], beforeStart, visit.id).valid,
        true,
    );
    assert.ok(
        validateDraft(
            { ...draft, startTime: "09:30", reminders: [30] },
            [visit],
            Date.parse(visit.startsAt) - 40 * 60_000,
            visit.id,
        ).errors.reminders,
    );
});
