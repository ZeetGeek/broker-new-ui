import type { AppToastVariant } from "@/components/shared/app-toast";

export const TOAST_GROUPS = [
    "Properties",
    "Clients & deals",
    "Visits & tasks",
    "System feedback",
] as const;

export type ToastExample = {
    id: string;
    group: (typeof TOAST_GROUPS)[number];
    variant: AppToastVariant;
    title: string;
    description?: string;
    detail?: string;
    actionLabel?: string;
};

/** Illustrative content only. None of these examples creates or updates real records. */
export const TOAST_EXAMPLES: ToastExample[] = [
    {
        id: "property-created",
        group: "Properties",
        variant: "success",
        title: "Property created",
        description: "Your listing is live and ready for brokers to discover.",
        actionLabel: "View property",
    },
    {
        id: "property-updated",
        group: "Properties",
        variant: "success",
        title: "Property updated",
        description: "Your latest changes have been saved.",
    },
    {
        id: "draft-saved",
        group: "Properties",
        variant: "success",
        title: "Draft saved on this device",
        description: "You can finish this listing later on the same device.",
    },
    {
        id: "property-saved",
        group: "Properties",
        variant: "success",
        title: "Property saved",
        description: "Find it again in your saved properties.",
    },
    {
        id: "property-removed",
        group: "Properties",
        variant: "info",
        title: "Moved to Deleted",
        description: "You can restore this property whenever you need it.",
        actionLabel: "Undo",
    },
    {
        id: "property-restored",
        group: "Properties",
        variant: "success",
        title: "Property restored",
        description: "It is back in your drafts.",
    },
    {
        id: "request-sent",
        group: "Properties",
        variant: "success",
        title: "Request sent to the owner",
        description: "Once approved, this property will appear in your listings.",
    },
    {
        id: "request-approved",
        group: "Properties",
        variant: "success",
        title: "Request approved",
        description: "The property is now in your listings. No need to enter it again.",
        actionLabel: "View property",
    },
    {
        id: "request-declined",
        group: "Properties",
        variant: "info",
        title: "Request declined",
        description: "The broker has been notified.",
    },
    {
        id: "client-added",
        group: "Clients & deals",
        variant: "success",
        title: "Client added",
        description: "Their contact details and requirements are saved.",
        actionLabel: "View client",
    },
    {
        id: "client-updated",
        group: "Clients & deals",
        variant: "success",
        title: "Client updated",
        description: "The latest details have been saved.",
    },
    {
        id: "client-attached",
        group: "Clients & deals",
        variant: "success",
        title: "Client attached to property",
        description: "You can now work this deal from your pipeline.",
    },
    { id: "note-saved", group: "Clients & deals", variant: "success", title: "Note saved" },
    {
        id: "offer-saved",
        group: "Clients & deals",
        variant: "success",
        title: "Offer saved",
        description: "The offer has been added to this deal.",
    },
    {
        id: "call-logged",
        group: "Clients & deals",
        variant: "success",
        title: "Call logged",
        description: "Your call notes are saved with this client.",
    },
    {
        id: "task-reminder",
        group: "Visits & tasks",
        variant: "reminder",
        title: "Task reminder",
        description: "Call your client about the Andheri apartment.",
        detail: "Due today · 4:30 pm",
        actionLabel: "View task",
    },
    {
        id: "visit-reminder",
        group: "Visits & tasks",
        variant: "reminder",
        title: "Your visit starts in 15 minutes",
        description: "2 BHK apartment, Andheri West",
        detail: "Today, 5:00 pm · Client: Priya Shah",
        actionLabel: "View visit",
    },
    {
        id: "visit-booked",
        group: "Visits & tasks",
        variant: "success",
        title: "Visit booked",
        description: "Your visit is confirmed for the selected time.",
        actionLabel: "View visit",
    },
    {
        id: "visit-requested",
        group: "Visits & tasks",
        variant: "info",
        title: "Visit request sent",
        description: "The owner still needs to confirm this time.",
    },
    {
        id: "visit-rescheduled",
        group: "Visits & tasks",
        variant: "success",
        title: "Visit rescheduled",
        description: "The updated time is saved in your visits.",
    },
    {
        id: "visit-cancelled",
        group: "Visits & tasks",
        variant: "success",
        title: "Visit cancelled",
        description: "The other party has been notified.",
    },
    {
        id: "task-completed",
        group: "Visits & tasks",
        variant: "success",
        title: "Task completed",
        description: "One less thing on your list.",
        actionLabel: "Undo",
    },
    {
        id: "copied",
        group: "System feedback",
        variant: "success",
        title: "Link copied",
        description: "Ready to share.",
    },
    {
        id: "profile-saved",
        group: "System feedback",
        variant: "success",
        title: "Profile saved",
        description: "Your contact details have been updated.",
    },
    {
        id: "loading",
        group: "System feedback",
        variant: "loading",
        title: "Saving your property…",
        description: "Please keep this page open.",
    },
    {
        id: "save-error",
        group: "System feedback",
        variant: "error",
        title: "Couldn't save your changes",
        description: "Your details are still here. Check your connection and try again.",
        actionLabel: "Try again",
    },
    {
        id: "upload-error",
        group: "System feedback",
        variant: "error",
        title: "Photo upload failed",
        description: "Choose the photo again to retry the upload.",
        actionLabel: "Try again",
    },
    {
        id: "offline",
        group: "System feedback",
        variant: "warning",
        title: "You're offline",
        description: "Check your internet connection before trying again.",
        actionLabel: "Try again",
    },
    {
        id: "validation",
        group: "System feedback",
        variant: "warning",
        title: "A few details need your attention",
        description: "Check the highlighted fields before publishing.",
        actionLabel: "Review details",
    },
    {
        id: "photo-limit",
        group: "System feedback",
        variant: "warning",
        title: "Photo limit reached",
        description: "Remove a photo before adding another.",
    },
    {
        id: "duplicate",
        group: "System feedback",
        variant: "info",
        title: "You've already sent a request",
        description: "You can check its status in your requests.",
        actionLabel: "View request",
    },
    {
        id: "property-available",
        group: "Properties",
        variant: "success",
        title: "Property is available again",
        description: "Brokers can discover your listing again.",
    },
    {
        id: "request-cancelled",
        group: "Properties",
        variant: "success",
        title: "Request cancelled",
        description: "Your request has been withdrawn.",
    },
    {
        id: "owner-added",
        group: "Clients & deals",
        variant: "success",
        title: "Owner added",
        description: "Their contact details are saved in your owners.",
    },
    {
        id: "visit-completed",
        group: "Visits & tasks",
        variant: "success",
        title: "Visit marked as completed",
        description: "The outcome is saved with this visit.",
    },
    {
        id: "task-added",
        group: "Visits & tasks",
        variant: "success",
        title: "Task added",
        description: "Find it in your tasks.",
        actionLabel: "View task",
    },
    {
        id: "reminder-sent",
        group: "Visits & tasks",
        variant: "success",
        title: "Reminder sent to the owner",
    },
    {
        id: "signed-in",
        group: "System feedback",
        variant: "success",
        title: "Signed in successfully",
    },
    { id: "signed-out", group: "System feedback", variant: "success", title: "Signed out" },
    {
        id: "verification-sent",
        group: "System feedback",
        variant: "success",
        title: "Verification email sent",
        description: "Check your inbox to verify your email address.",
    },
    {
        id: "password-reset",
        group: "System feedback",
        variant: "success",
        title: "Password reset successfully",
        description: "You can now sign in with your new password.",
    },
];

export const TOAST_VARIANTS: {
    variant: AppToastVariant;
    label: string;
    exampleId: string;
    note: string;
}[] = [
    {
        variant: "success",
        label: "Success",
        exampleId: "property-created",
        note: "Confirm a completed action.",
    },
    {
        variant: "reminder",
        label: "Reminder",
        exampleId: "task-reminder",
        note: "Bring a task or visit back into focus.",
    },
    {
        variant: "error",
        label: "Error",
        exampleId: "save-error",
        note: "Explain the problem and offer recovery.",
    },
    {
        variant: "warning",
        label: "Warning",
        exampleId: "offline",
        note: "Flag something that needs attention.",
    },
    {
        variant: "info",
        label: "Information",
        exampleId: "duplicate",
        note: "Give useful context without alarm.",
    },
    {
        variant: "loading",
        label: "Loading",
        exampleId: "loading",
        note: "Stay visible while an operation is in progress.",
    },
];
