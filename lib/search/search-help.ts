export type SearchHelp = {
    fields: readonly string[];
    example: string;
    filterNote: string;
};

/** Keep each list aligned with the fields searched by that page's matcher. */
export const CRM_SEARCH_HELP = {
    history: {
        fields: [
            "Notification or update title",
            "Message or update details",
            "Names, properties or areas shown in the text",
            "Type, such as Visits or Clients",
        ],
        example: "Arjun Andheri",
        filterNote:
            "Search checks loaded history only. Your selected type and read status still apply.",
    },
    clients: {
        fields: [
            "Client name",
            "Phone number",
            "Email address",
            "Area",
            "Notes",
            "Linked property",
        ],
        example: "Ravi Andheri",
        filterNote: "Your selected tab and filters still apply.",
    },
    owners: {
        fields: ["Owner name", "Phone number", "Email address", "Area", "Notes", "Linked property"],
        example: "Patel Surat",
        filterNote: "Your selected tab and filters still apply.",
    },
    listings: {
        fields: [
            "Property title",
            "Area or city",
            "Address, society or landmark",
            "PIN code",
            "Property type or BHK",
            "Owner name or phone number",
            "Linked client name",
        ],
        example: "Andheri 2 BHK",
        filterNote: "Your selected status and filters still apply.",
    },
    deals: {
        fields: [
            "Client name or phone number",
            "Owner name or phone number",
            "Property title",
            "Area or city",
            "Property type or BHK",
            "Deal notes",
        ],
        example: "Ravi Andheri",
        filterNote: "Your selected view and filters still apply.",
    },
    visits: {
        fields: [
            "Client name or phone number",
            "Owner name",
            "Property title",
            "Area or city",
            "Visit notes",
        ],
        example: "Ravi Andheri",
        filterNote: "Your selected status, dates and filters still apply.",
    },
    tasks: {
        fields: [
            "Task name",
            "Notes",
            "Linked client or owner name",
            "Linked property title",
            "Property area or city",
        ],
        example: "call Ravi",
        filterNote: "Your selected tab and filters still apply.",
    },
} as const satisfies Record<string, SearchHelp>;
