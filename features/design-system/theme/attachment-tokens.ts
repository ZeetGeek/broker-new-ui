export const ATTACHMENT_STATES = [
    {
        name: "done",
        label: "Done",
        note: "Uploaded and ready. Default resting state.",
    },
    {
        name: "uploading",
        label: "Uploading",
        note: "Title shimmers. Pair with a progress hint in the description.",
    },
    {
        name: "processing",
        label: "Processing",
        note: "Same shimmer as uploading — server still working.",
    },
    {
        name: "error",
        label: "Error",
        note: "Danger border + soft fill. Put the reason in the description.",
    },
    {
        name: "idle",
        label: "Idle",
        note: "Dashed border — empty drop target before a file is chosen.",
    },
] as const;

export const ATTACHMENT_SIZES = [
    {
        name: "default",
        label: "Default",
        note: "Composer rows and message threads.",
    },
    {
        name: "sm",
        label: "Small",
        note: "Dense lists and secondary panels.",
    },
    {
        name: "xs",
        label: "Extra small",
        note: "Tight chips — keep actions icon-only.",
    },
] as const;

export const ATTACHMENT_ORIENTATIONS = [
    {
        name: "horizontal",
        label: "Horizontal",
        note: "Media beside title — files and docs.",
    },
    {
        name: "vertical",
        label: "Vertical",
        note: "Media above title — image previews.",
    },
] as const;

export const ATTACHMENT_USES = [
    {
        name: "file",
        label: "File",
        note: "PDF / doc with icon media and remove action.",
    },
    {
        name: "image",
        label: "Image",
        note: "variant=image + vertical orientation for photo tiles.",
    },
    {
        name: "group",
        label: "Group",
        note: "AttachmentGroup — snap-scrolling row with edge fade.",
    },
    {
        name: "states",
        label: "Upload states",
        note: "Wire state to real upload status — never fake it.",
    },
] as const;
