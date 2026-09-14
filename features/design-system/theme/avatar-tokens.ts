export const AVATAR_USES = [
    {
        name: "image",
        label: "Image",
        note: "Photo when the URL loads. Falls back to initials on error.",
    },
    {
        name: "fallback",
        label: "Fallback",
        note: "Initials on muted when there is no photo yet.",
    },
    {
        name: "badge",
        label: "Badge",
        note: "Status or count pip on the corner — keep it tiny.",
    },
    {
        name: "user-avatar",
        label: "UserAvatar",
        note: "Product default — photo, shape, or character via avvvatars-react.",
    },
] as const;

export const AVATAR_SIZES = [
    {
        name: "sm",
        label: "SM",
        note: "32px — dense rows, chips, stacked faces.",
    },
    {
        name: "default",
        label: "MD",
        note: "40px — default. Lists, cards, menus.",
    },
    {
        name: "lg",
        label: "LG",
        note: "48px — profile headers and focus faces.",
    },
] as const;

export const AVATAR_GROUPS = [
    {
        name: "compound",
        label: "AvatarGroup",
        note: "Compound overlap from components/ui/avatar. Short lists.",
    },
    {
        name: "stack",
        label: "AvatarStack",
        note: "Product stack — tooltips, overflow +N, shared UserAvatar.",
    },
] as const;
