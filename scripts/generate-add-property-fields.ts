import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
    PROPERTY_CATEGORY_OPTIONS,
    PROPERTY_TYPES,
    toLabel,
} from "../constants/property";
import { DEFAULT_PROPERTY_DRAFT, type PropertyDraftValues } from "../lib/schemas/property";
import { isVisible, labelOf, levelOf, STEP_FIELD_PATHS } from "../lib/visibility/rules";

/**
 * Step 2 in the form is id "details", UI label "Property".
 * It renders StepDetails + StepArea (title, description, rooms, building,
 * commercial extras, area fields).
 */
const STEP_ID = "details" as const;

const LABEL_OVERRIDES: Record<string, string> = {
    "basics.title": "Listing title",
    "basics.description": "Description",
    "details.propertyAge": "How many years old?",
    "area.carpetArea": "Carpet area",
    "area.plotArea": "Area",
};

const SECTION_HINTS: { match: (path: string) => boolean; title: string }[] = [
    {
        match: (path) => path.startsWith("details.bedrooms") || path === "details.bathrooms" || path === "details.balconies" || path === "details.coveredParking",
        title: "Rooms and layout",
    },
    {
        match: (path) => path === "basics.title" || path === "basics.description",
        title: "Listing copy",
    },
    {
        match: (path) =>
            path.startsWith("details.") &&
            !path.startsWith("details.commercial.") &&
            !path.startsWith("details.land.") &&
            path !== "details.bedrooms" &&
            path !== "details.bathrooms" &&
            path !== "details.balconies" &&
            path !== "details.coveredParking",
        title: "Building facts",
    },
    {
        match: (path) => path.startsWith("details.commercial."),
        title: "Commercial setup",
    },
    {
        match: (path) => path.startsWith("details.land."),
        title: "Land / plot",
    },
    {
        match: (path) => path.startsWith("area."),
        title: "Area",
    },
];

function cloneDraft(category: string, propertyType: string): PropertyDraftValues {
    const draft = structuredClone(DEFAULT_PROPERTY_DRAFT);
    draft.basics.category = category as PropertyDraftValues["basics"]["category"];
    draft.basics.propertyType = propertyType;
    draft.basics.listingFor = "sell";
    draft.area.areaSqft = 1000;
    return draft;
}

function humanLevel(level: string) {
    if (level === "required") return "REQUIRED";
    if (level === "recommended") return "recommended";
    return "optional";
}

function displayLabel(path: string, values: PropertyDraftValues) {
    return LABEL_OVERRIDES[path] ?? labelOf(path, values);
}

function sectionFor(path: string) {
    return SECTION_HINTS.find((item) => item.match(path))?.title ?? "Other";
}

const allTypes: { category: string; type: string }[] = [];
for (const category of Object.keys(PROPERTY_TYPES) as (keyof typeof PROPERTY_TYPES)[]) {
    for (const type of PROPERTY_TYPES[category]) {
        allTypes.push({ category, type });
    }
}

const lines: string[] = [];
lines.push("ADD PROPERTY — Step 2 “Property” fields by property type");
lines.push("Form step id: details  |  UI label: Property");
lines.push("Includes: rooms/layout, listing title & description, building facts,");
lines.push("commercial extras (when shown), and area (StepArea).");
lines.push("Does NOT include Basics, Price & deal, Amenities, or Media steps.");
lines.push("Source: lib/visibility/rules.ts + step-details.tsx + step-area.tsx");
lines.push("Regenerate: npx tsx scripts/generate-add-property-fields.ts");
lines.push("");
lines.push("LEGEND");
lines.push("  REQUIRED     = required on this step before continuing / publish");
lines.push("  recommended  = suggested");
lines.push("  optional     = shown, not required");
lines.push("");

for (const { category, type } of allTypes) {
    const catLabel =
        PROPERTY_CATEGORY_OPTIONS.find((item) => item.value === category)?.label ?? category;
    const values = cloneDraft(category, type);
    const paths = STEP_FIELD_PATHS[STEP_ID] ?? [];

    const rows = paths
        .filter((path) => isVisible(path, values))
        .map((path) => ({
            path,
            label: displayLabel(path, values),
            level: humanLevel(levelOf(path, values)),
            section: sectionFor(path),
        }));

    // Prefer UI section order
    const sectionOrder = [
        "Rooms and layout",
        "Listing copy",
        "Building facts",
        "Commercial setup",
        "Land / plot",
        "Area",
        "Other",
    ];
    rows.sort(
        (a, b) =>
            sectionOrder.indexOf(a.section) - sectionOrder.indexOf(b.section) ||
            a.label.localeCompare(b.label),
    );

    lines.push("=".repeat(72));
    lines.push(`${catLabel.toUpperCase()} › ${toLabel(type)}  (${type})`);
    lines.push("=".repeat(72));

    let lastSection = "";
    for (const row of rows) {
        if (row.section !== lastSection) {
            lastSection = row.section;
            lines.push("");
            lines.push(`  [${row.section}]`);
        }
        lines.push(`    - [${row.level}] ${row.label}`);
    }
    if (!rows.length) {
        lines.push("");
        lines.push("  (no Property-step fields for this type — check visibility rules)");
    }
    lines.push("");
}

const out = resolve(process.cwd(), "docs/add-property-fields-by-type.txt");
writeFileSync(out, `${lines.join("\n")}\n`);
console.log(`Wrote ${out} (${lines.length} lines)`);
