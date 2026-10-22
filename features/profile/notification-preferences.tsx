"use client";

import { useCallback, useMemo, useState } from "react";

import { Bell } from "@/components/shared/icons";

import { profileApi, type UserProfile } from "@/lib/api/profile";
import { cn } from "@/lib/utils";

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

const SWITCH_CLASS = `
  data-checked:border-brand data-checked:bg-brand
  data-unchecked:border-border-warm data-unchecked:bg-border-warm
`;

type NotificationPreferencesProps = {
    profile: UserProfile | null;
    onSaved: (profile: UserProfile) => void;
};

/**
 * Notification channels, saved on toggle.
 *
 * Same option-card chrome as property-form "Listing for" — one row of
 * border-2 tiles — but each channel is an independent Switch, not a radio.
 *
 * Failures stay inline under the grid (docs/MESSAGES.md).
 */
export function NotificationPreferences({ profile, onSaved }: NotificationPreferencesProps) {
    const [pendingChannel, setPendingChannel] = useState<Channel | null>(null);
    const [errorChannel, setErrorChannel] = useState<Channel | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            setErrorChannel(null);
            setErrorMessage(null);
            try {
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
                setErrorChannel(channel);
                setErrorMessage("Could not save that. Check your connection and try again.");
            } finally {
                setPendingChannel(null);
            }
        },
        [onSaved, prefs, profile],
    );

    return (
        <section aria-labelledby="notification-preferences-heading">
            <div className="mbe-4">
                <h2
                    id="notification-preferences-heading"
                    className="
                      flex items-center gap-2.5 font-display text-xl font-semibold
                      tracking-[-0.02em] text-ink
                    "
                >
                    <Bell
                        className="shrink-0 text-brand block-5 inline-5"
                        strokeWidth={1.75}
                        aria-hidden
                    />
                    How we reach you
                </h2>
                <p className="mbs-1 text-sm/6 text-ink-muted max-inline-2xl">
                    Saved as you change them.
                </p>
            </div>

            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {CHANNELS.map((channel) => {
                    const on = prefs[channel.id];
                    const isPending = pendingChannel === channel.id;
                    const hasError = errorChannel === channel.id && Boolean(errorMessage);

                    return (
                        <li key={channel.id} className="flex flex-col gap-1.5 min-inline-0">
                            <label
                                htmlFor={`notify-${channel.id}`}
                                className={cn(
                                    `
                                      flex cursor-pointer items-start gap-3 rounded-control border-2
                                      px-4 py-3.5 text-start leading-normal transition-[background-color,border-color,color,box-shadow]
                                      duration-160 min-block-12
                                      has-focus-visible:ring-3 has-focus-visible:ring-ring/30
                                    `,
                                    on
                                        ? "border-brand bg-brand-soft text-brand-text shadow-xs"
                                        : `
                                          border-border-warm bg-surface-muted text-ink
                                          hover:border-brand/40 hover:bg-surface
                                        `,
                                    isPending && "pointer-events-none opacity-70",
                                    hasError && "border-danger",
                                    !profile && "pointer-events-none opacity-50",
                                )}
                            >
                                <span className="flex-1 min-inline-0">
                                    <span className="block text-sm/5 font-semibold">
                                        {channel.label}
                                    </span>
                                    <span
                                        className={cn(
                                            "mbs-0.5 block text-xs/4",
                                            on ? "text-brand-text/70" : "text-ink-muted",
                                        )}
                                    >
                                        {channel.hint}
                                    </span>
                                </span>

                                <Switch
                                    id={`notify-${channel.id}`}
                                    checked={on}
                                    disabled={!profile || isPending}
                                    aria-invalid={hasError || undefined}
                                    onCheckedChange={(checked) =>
                                        void handleToggle(channel.id, checked)
                                    }
                                    className={cn(SWITCH_CLASS, "mts-0.5 shrink-0")}
                                />
                            </label>

                            {hasError ? (
                                <p role="alert" className="body-sm text-danger">
                                    {errorMessage}
                                </p>
                            ) : null}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
