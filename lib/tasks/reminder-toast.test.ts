import assert from "node:assert/strict";
import test from "node:test";

import type { NotificationItem } from "@/lib/api/notifications";
import { getNotificationTab, getNotificationVisual } from "@/lib/notifications/classify";

import { reminderToastContent } from "@/features/tasks/reminder-toast";

function item(overrides: Partial<NotificationItem>): NotificationItem {
    return {
        id: "n1",
        userId: "u1",
        actorUserId: null,
        type: "system",
        title: "Hello",
        body: null,
        href: null,
        referenceType: null,
        referenceId: null,
        relatedPropertyId: null,
        relatedRepresentationId: null,
        relatedLeadId: null,
        metadata: null,
        representationStatus: null,
        isRead: false,
        readAt: null,
        createdAt: null,
        ...overrides,
    };
}

test("a task reminder becomes the task toast", () => {
    assert.deepEqual(
        reminderToastContent(
            item({
                type: "task_reminder",
                title: "Task reminder",
                body: "Call Aarav · At due time · Today, 2:52 PM",
                href: "/broker/tasks?view=detail&task=t1",
                referenceId: "t1",
            }),
        ),
        {
            kind: "task",
            title: "Task reminder",
            line: "Call Aarav",
            detail: "At due time · Today, 2:52 PM",
            href: "/broker/tasks?view=detail&task=t1",
            action: "View task",
        },
    );
});

test("a visit reminder becomes the visit toast", () => {
    const content = reminderToastContent(
        item({
            type: "visit_reminder",
            title: "Visit reminder",
            body: "Happy Elegance with Aarav Shah · In 30 min · Today, 4:00 PM",
            href: "/broker/visits",
        }),
    );
    assert.equal(content?.kind, "visit");
    assert.equal(content?.line, "Happy Elegance with Aarav Shah");
    assert.equal(content?.detail, "In 30 min · Today, 4:00 PM");
    assert.equal(content?.action, "View visit");
    assert.equal(content?.href, "/broker/visits");
});

test("other notifications are not reminder toasts", () => {
    assert.equal(reminderToastContent(item({ type: "visit_approved" })), null);
});

test("task reminders get their own bell visual", () => {
    const visual = getNotificationVisual(
        item({ type: "task_reminder", title: "Task reminder", body: "Visit the property" }),
    );
    assert.equal(visual.iconName, "bell-ring");
    assert.equal(visual.colorClass, "!text-brand");
});

test("reminders land in a fixed bell tab whatever the task is called", () => {
    assert.equal(
        getNotificationTab(
            item({
                type: "task_reminder",
                title: "Task reminder",
                body: "Respond to request · Schedule site visit · At due time · Today, 2:52 PM",
            }),
        ),
        "updates",
    );
    assert.equal(
        getNotificationTab(
            item({
                type: "visit_reminder",
                title: "Visit reminder",
                body: "Referral message flat with Ravi · In 30 min · Today, 4:00 PM",
            }),
        ),
        "visits",
    );
});

test("visit reminders get a calendar visual in brand colour", () => {
    const visual = getNotificationVisual(
        item({
            type: "visit_reminder",
            title: "Visit reminder",
            body: "Referral message flat with Ravi · In 30 min · Today, 4:00 PM",
        }),
    );
    assert.equal(visual.iconName, "calendar");
    assert.equal(visual.colorClass, "!text-brand");
});
