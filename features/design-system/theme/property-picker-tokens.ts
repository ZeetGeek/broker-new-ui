/** Reference copy for the Property picker design-system page. */

export const PROPERTY_PICKER_USES = [
    {
        title: "Dialog · single",
        body: "Visit attach, task property link, and any screen that must pick one listing with room to search and scan covers.",
    },
    {
        title: "Dialog · multi",
        body: "Attach several listings to a lead or visit. Confirm stays in the footer.",
    },
    {
        title: "Sale / Rent tabs",
        body: "All / Sale / Rent appear when lookingFor is both. Lock lookingFor to sale or rent when the pool is already scoped.",
    },
    {
        title: "Field trigger",
        body: "Forms and filter sheets. PropertyPickerField opens the same modal with a cover + title face when chosen.",
    },
    {
        title: "Inline select",
        body: "Compact filters and dense fields. All / Sale / Rent in the popup; Add property when search finds nobody.",
    },
] as const;

export const PROPERTY_PICKER_API = [
    {
        name: "lookingFor",
        detail: `"sale" | "rent" | "both" (default) — scopes the modal list and whether Sale / Rent tabs show.`,
    },
    {
        name: "multiple",
        detail: "false (default) commits on row tap; true keeps a draft until Confirm.",
    },
    {
        name: "properties",
        detail: "Caller-owned rows: id, title, propertyTypeLabel, areaSqft / BHK, locality / city / state, saleAmountInr / rentAmountInr (+ optional commission). Row shows ask, info, location, Sale/Rent.",
    },
    {
        name: "onCreate",
        detail: "Optional — shows Add property. The picker never owns the create form.",
    },
    {
        name: "PropertyPickerField",
        detail: "Form trigger that opens the same modal. Use for required property fields.",
    },
    {
        name: "PropertyInlineSelect",
        detail: "Combobox face for filters and compact fields. Scope tabs All / Sale / Rent; Add property on empty search.",
    },
] as const;
