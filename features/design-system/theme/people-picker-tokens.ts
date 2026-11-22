/** Reference copy for the People picker design-system page. */

export const PEOPLE_PICKER_USES = [
    {
        title: "Client only",
        body: "Visit forms, pipeline attach, and any screen that must pick a Client — never an owner.",
    },
    {
        title: "Owner only",
        body: "Exclusive-owner attach, owner filters, and owner invite flows.",
    },
    {
        title: "Both",
        body: "Task @-mentions, notes, and any field that can link either role. Role tabs appear automatically; rows use a color pip (not a Client/Owner chip).",
    },
    {
        title: "Multi-select",
        body: "Attach several clients to a listing or visit. Confirm stays in the footer.",
    },
    {
        title: "Inline select",
        body: "Mentions, filter sheets, and compact fields. All / Clients / Owners in the popup; Create it when search finds nobody.",
    },
] as const;

export const PEOPLE_PICKER_API = [
    {
        name: "kinds",
        detail: `"client" | "owner" | "both" — scopes the modal list and copy.`,
    },
    {
        name: "multiple",
        detail: "false (default) commits on row tap; true keeps a draft until Confirm.",
    },
    {
        name: "people",
        detail: "Caller-owned rows: id, name, role, optional phoneDigits / ownerType / detail (clients only) / lookingFor / imageUrl.",
    },
    {
        name: "onCreate",
        detail: "Optional — shows Create client / owner. The picker never owns the create form.",
    },
    {
        name: "PeoplePickerField",
        detail: "Form trigger that opens the same modal. Use for required Client / Owner fields.",
    },
    {
        name: "PeopleInlineSelect",
        detail: "Combobox face for mentions and filters. Scope tabs All / Clients / Owners; Create it on empty search.",
    },
] as const;
