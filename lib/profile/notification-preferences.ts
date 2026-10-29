import { profileApi, type UserProfile } from "@/lib/api/profile";

export type NotificationChannel = "whatsapp" | "sms" | "email";

/** Keep full-preference writes from racing against another channel's snapshot. */
export class NotificationPreferencesWriter {
    private pending = false;

    get isSaving() {
        return this.pending;
    }

    async save(
        profile: UserProfile,
        channel: NotificationChannel,
        enabled: boolean,
    ): Promise<UserProfile | null> {
        if (this.pending) return null;
        this.pending = true;
        const notifications = {
            ...profile.notifications,
            whatsapp: profile.notifications?.whatsapp ?? true,
            sms: profile.notifications?.sms ?? false,
            email: profile.notifications?.email ?? true,
            [channel]: enabled,
        };
        try {
            await profileApi.updateNotifications({
                notifyWhatsapp: notifications.whatsapp,
                notifySms: notifications.sms,
                notifyEmail: notifications.email,
            });
            return { ...profile, notifications };
        } finally {
            this.pending = false;
        }
    }
}
