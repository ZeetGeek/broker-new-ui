import assert from "node:assert/strict";
import test from "node:test";

import { api } from "@/lib/api/client";
import type { UserProfile } from "@/lib/api/profile";
import { NotificationPreferencesWriter } from "@/lib/profile/notification-preferences";

test("notification saves reject overlapping writes and preserve a previously saved channel", async (t) => {
    const original = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = original;
    });
    const payloads: unknown[] = [];
    let release!: () => void;
    let started!: () => void;
    const ready = new Promise<void>((resolve) => {
        started = resolve;
    });
    api.defaults.adapter = async (config) => {
        payloads.push(JSON.parse(config.data));
        if (payloads.length === 1) {
            started();
            await new Promise<void>((resolve) => {
                release = resolve;
            });
        }
        return { data: {}, status: 200, statusText: "OK", headers: {}, config };
    };
    const profile = {
        notifications: { whatsapp: true, sms: false, email: true, unreadCount: 7 },
    } as UserProfile;
    const writer = new NotificationPreferencesWriter();
    const first = writer.save(profile, "whatsapp", false);
    await ready;
    assert.equal(writer.isSaving, true);
    assert.equal(await writer.save(profile, "sms", true), null);
    assert.equal(payloads.length, 1);
    release();
    const saved = await first;
    assert.ok(saved);
    const second = await writer.save(saved, "sms", true);
    assert.deepEqual(payloads, [
        { notifyWhatsapp: false, notifySms: false, notifyEmail: true },
        { notifyWhatsapp: false, notifySms: true, notifyEmail: true },
    ]);
    assert.equal(second?.notifications?.unreadCount, 7);
    assert.equal(writer.isSaving, false);
});

test("a failed notification save releases the lock without reporting changed preferences", async (t) => {
    const original = api.defaults.adapter;
    t.after(() => {
        api.defaults.adapter = original;
    });
    api.defaults.adapter = async () => {
        throw new Error("Offline");
    };
    const profile = { notifications: { whatsapp: true, sms: false, email: true } } as UserProfile;
    const writer = new NotificationPreferencesWriter();
    await assert.rejects(writer.save(profile, "email", false), /Offline/);
    assert.equal(writer.isSaving, false);
    assert.equal(profile.notifications?.email, true);
});
