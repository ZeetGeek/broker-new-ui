import type { PropertyDraftValues } from "@/lib/schemas/property";
import { isVisible, labelOf, STEP_FIELD_PATHS, valueAtPath } from "@/lib/visibility/rules";

import type { PropertyFormStep } from "@/constants/property";
import type { MyListingItem } from "@/features/properties/your-listings/types";

// These scalar fields are omitted when empty by the current multipart API.
// Until the server defines a clearing protocol, never report such an edit as saved.
const SCALAR_FIELDS = [
    ["unitNumber", "location.unitNumber"],
    ["pinCode", "location.pincode"],
    ["landmark", "location.landmark"],
    ["society", "location.projectOrSociety"],
    ["state", "location.state"],
    ["description", "basics.description"],
    ["carpetAreaSqft", "area.carpetArea"],
    ["propertyAge", "details.propertyAge"],
    ["propertyCondition", "details.propertyCondition"],
    ["bathrooms", "details.bathrooms"],
    ["balconies", "details.balconies"],
    ["floorNumber", "details.floorNumber"],
    ["totalFloors", "details.totalFloors"],
    ["facing", "details.facing"],
    ["availableFrom", "rent.availableFrom"],
    ["securityDeposit", "rent.securityDeposit"],
    ["saleAmountInr", "sale.expectedPrice"],
    ["rentAmountInr", "rent.monthlyRent"],
    ["commissionPercent", "commission.sale.value"],
    ["commissionAmount", "commission.rent.value"],
    ["cabins", "details.commercial.cabins"],
    ["meetingRooms", "details.commercial.meetingRooms"],
    ["workstations", "details.commercial.workstations"],
    ["ceilingHeightFt", "details.commercial.ceilingHeightFt"],
] as const satisfies readonly (readonly [keyof MyListingItem, string])[];

function isEmpty(value: unknown) {
    return value == null || (typeof value === "string" && !value.trim());
}

export function unsupportedPropertyClears(previous: MyListingItem, current: PropertyDraftValues) {
    const fields: Array<readonly [keyof MyListingItem, string]> = [...SCALAR_FIELDS];
    const maintenancePaths = ["sale.maintenanceCharge", "rent.maintenanceAmount"].filter((path) =>
        isVisible(path, current),
    );
    if (
        maintenancePaths.length &&
        maintenancePaths.every((path) => isEmpty(valueAtPath(current, path)))
    ) {
        fields.push(["maintenanceInr", maintenancePaths[0]!]);
    }
    return fields.flatMap(([key, path]) => {
        if (
            isEmpty(previous[key]) ||
            !isVisible(path, current) ||
            !isEmpty(valueAtPath(current, path))
        )
            return [];
        const step =
            (Object.keys(STEP_FIELD_PATHS) as PropertyFormStep[]).find((id) =>
                STEP_FIELD_PATHS[id].includes(path),
            ) ?? "details";
        const label = labelOf(path, current);
        return [
            {
                path,
                step,
                label,
                message: `Keep or replace the saved ${label.toLowerCase().replace(/\.$/, "")}. Removing it is not supported yet.`,
            },
        ];
    });
}
