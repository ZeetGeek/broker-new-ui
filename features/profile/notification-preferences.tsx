"use client";

import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { profileApi, type UserProfile } from "@/lib/api/profile";

import { Switch } from "@/components/ui/switch";

type Channel = "whatsapp" | "sms" | "email";

const CHANNELS: {
    id: Channel;
    label: string;
    hint: string;
    apiKey: "notifyWhatsapp" | "notifySms" | "notifyEmail";
}[] = [
    {
        id: "whatsapp",
        label: "WhatsApp",
        hint: "How most owners reply. Turning this off will cost you deals.",
        apiKey: "notifyWhatsapp",
    },
    {
        id: "sms",
        label: "SMS",
        hint: "A text when WhatsApp does not reach you.",
        apiKey: "notifySms",
    },
    {
        id: "email",
        label: "Email",
        hint: "A daily summary of what needs you.",
        apiKey: "notifyEmail",
    },
];

type NotificationPreferencesProps = {
    profile: UserProfile | null;
    onSaved: (profile: UserProfile) => void;
};

/**
 * Notification channels, saved on toggle.
 *
 * No save button, unlike the reference mock. A switch that has visibly moved
 * but has not saved is the most reliable way to lose a preference — the user
 * has every reason to believe the flip *was* the action. Saving on change and
 * reverting on failure keeps the switch honest.
 */
export function NotificationPreferences({ profile, onSaved }: NotificationPreferencesProps) {
    const [pendingChannel, setPendingChannel] = useState<Channel | null>(null);

    // Memoised so the toggle handler below keeps a stable identity — rebuilding
    // this object every render would make its useCallback pointless.
    const prefs = useMemo(
        () => ({
            whatsapp: profile?.notifications?.whatsapp ?? true,
            sms: profile?.notifications?.sms ?? false,
            email: profile?.notifications?.email ?? true,
        }),
        [profile?.notifications],
    );

    const handleToggle = useCallback(
        async (channel: Channel, next: boolean) => {
            if (!profile) return;

            const apiKey = CHANNELS.find((c) => c.id === channel)?.apiKey;
            if (!apiKey) return;

            setPendingChannel(channel);
            try {
                // Backend returns `{ message }` only — merge the flip into the
                // profile we already hold so the switch stays honest.
                await profileApi.updateNotifications({
                    notifyWhatsapp: prefs.whatsapp,
                    notifySms: prefs.sms,
                    notifyEmail: prefs.email,
                    [apiKey]: next,
                });
                onSaved({
                    ...profile,
                    notifications: {
                        ...profile.notifications,
                        unreadCount: profile.notifications?.unreadCount,
                        whatsapp: channel === "whatsapp" ? next : prefs.whatsapp,
                        sms: channel === "sms" ? next : prefs.sms,
                        email: channel === "email" ? next : prefs.email,
                    },
                });
            } catch {
                toast.error("Could not save that. Try again.");
                // The parent still holds the old profile, so not calling
                // `onSaved` is what puts the switch back.
            } finally {
                setPendingChannel(null);
            }
        },
        [onSaved, prefs, profile],
    );

    return (
        <section
            className="
              flex flex-col gap-4 rounded-card border border-border-warm bg-surface p-4
              sm:p-5
            "
            aria-labelledby="notification-preferences-heading"
        >
            <div className="flex flex-col gap-0.5">
                <h2 id="notification-preferences-heading" className="body font-semibold text-ink">
                    How we reach you
                </h2>
                <p className="body-sm text-ink-muted">Saved as you change them.</p>
            </div>

            <ul className="flex flex-col">
                {CHANNELS.map((channel, index) => (
                    <li
                        key={channel.id}
                        className={
                            index < CHANNELS.length - 1
                                ? `
                                  flex items-start justify-between gap-4 border-be
                                  border-border-warm py-3
                                `
                                : "flex items-start justify-between gap-4 pbs-3"
                        }
                    >
                        <label
                            htmlFor={`notify-${channel.id}`}
                            className="flex flex-1 flex-col gap-0.5 min-inline-0"
                        >
                            <span className="body-sm font-medium text-ink">{channel.label}</span>
                            <span className="body-xs text-ink-subtle">{channel.hint}</span>
                        </label>

                        <Switch
                            id={`notify-${channel.id}`}
                            checked={prefs[channel.id]}
                            disabled={!profile || pendingChannel === channel.id}
                            onCheckedChange={(checked) => void handleToggle(channel.id, checked)}
                        />
                    </li>
                ))}
            </ul>
        </section>
    );
}
