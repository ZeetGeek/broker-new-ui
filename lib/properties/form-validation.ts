import { isUsablePropertyPhoto, MAX_PROPERTY_PHOTOS } from "@/lib/properties/form-media";
import {
    ownerCommissionIssues,
    type PropertyDraftValues,
    stepSchemas,
} from "@/lib/schemas/property";
import {
    isVisible,
    missingRequiredFields,
    requiredFieldMessage,
    valueAtPath,
} from "@/lib/visibility/rules";

/** Drafts can be incomplete, but values already entered must satisfy their constraints. */
export function propertyDraftValidationIssues(values: PropertyDraftValues) {
    return (Object.keys(stepSchemas) as (keyof typeof stepSchemas)[]).flatMap((step) => {
        const parsed = stepSchemas[step].safeParse(values);
        if (parsed.success) return [];
        return parsed.error.issues.flatMap((issue) => {
            const path = issue.path.join(".");
            if (!isVisible(path, values)) return [];
            if (path === "media.cover" || (path === "media.photos" && issue.code === "custom"))
                return [];
            // A description in progress is valid in a draft; its maximum length still applies.
            if (path === "basics.description" && issue.code === "too_small") return [];
            const value = valueAtPath(values, path);
            if (value == null || (typeof value === "string" && !value.trim())) return [];
            return [{ step, path, message: issue.message }];
        });
    });
}

/** Only controls rendered by Quick add. Full publish validation remains separate. */
export const QUICK_ADD_VALIDATION_FIELDS = [
    "basics.listingFor",
    "basics.category",
    "basics.propertyType",
    "basics.title",
    "details.bedrooms",
    "location.country",
    "location.state",
    "location.city",
    "location.locality",
    "location.pincode",
    "location.landmark",
    "location.projectOrSociety",
    "area.plotArea",
    "sale.expectedPrice",
    "rent.monthlyRent",
    "commission.sale.value",
    "commission.rent.value",
    "media.cover",
    "media.photos",
] as const;

export function quickAddValidationIssues(
    values: PropertyDraftValues,
    portal: "broker" | "owner",
): { path: string; message: string }[] {
    const fields = new Set<string>(
        QUICK_ADD_VALIDATION_FIELDS.filter(
            (path) =>
                isVisible(path, values) && (portal === "owner" || !path.startsWith("commission.")),
        ),
    );
    const issues = new Map<string, { path: string; message: string }>();
    for (const step of ["basics", "details", "pricing", "media"] as const) {
        const result = stepSchemas[step].safeParse(values);
        if (result.success) continue;
        for (const issue of result.error.issues) {
            const path = issue.path.join(".");
            // Quick drafts need one usable photo, not the full gallery required to publish.
            if (path === "media.cover" || (path === "media.photos" && issue.code === "custom"))
                continue;
            if (!fields.has(path) && !path.startsWith("media.photos.")) continue;
            const target = path.startsWith("media.photos.") ? "media.photos" : path;
            issues.set(target, { path: target, message: issue.message });
        }
    }
    for (const missing of missingRequiredFields(values)) {
        if (!fields.has(missing.path) || missing.path.startsWith("media.")) continue;
        if (!issues.has(missing.path))
            issues.set(missing.path, {
                path: missing.path,
                message: requiredFieldMessage(missing.path, values),
            });
    }
    if (portal === "owner") {
        for (const issue of ownerCommissionIssues(values)) issues.set(issue.path, issue);
    }
    const usable = values.media.photos.filter(isUsablePropertyPhoto);
    if (!usable.some((photo) => photo.isCover))
        issues.set("media.cover", { path: "media.cover", message: "Add a cover photo" });
    if (values.media.photos.some((photo) => photo.status === "processing")) {
        issues.set("media.photos", {
            path: "media.photos",
            message: "Wait for your photos to finish preparing",
        });
    }
    if (values.media.photos.length > MAX_PROPERTY_PHOTOS) {
        issues.set("media.photos", {
            path: "media.photos",
            message: `Add up to ${MAX_PROPERTY_PHOTOS} photos`,
        });
    }
    return [...issues.values()];
}
