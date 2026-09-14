import type { ReactNode } from "react";

import {
    Bed,
    Building,
    Building2,
    Factory,
    Home,
    Hotel,
    Key,
    Landmark,
    LayoutPanelTop,
    Map,
    Repeat,
    Store,
    Tag,
    Trees,
    Warehouse,
} from "lucide-react";

import type { PropertyCategory, PropertyFormValues, PropertyType } from "@/lib/validation/property";

import type { ListingFor } from "@/constants/property";

/** Deal type — sale, rent, or both. */
export const TRANSACTION_TYPE_ICONS: Record<PropertyFormValues["transactionType"], ReactNode> = {
    sale: <Tag />,
    rent: <Key />,
    both: <Repeat />,
};

export const LISTING_FOR_ICONS: Record<ListingFor, ReactNode> = {
    sell: <Tag />,
    rent: <Key />,
};

export const CATEGORY_ICONS: Record<PropertyCategory | "agricultural", ReactNode> = {
    residential: <Home />,
    commercial: <Store />,
    industrial: <Factory />,
    land: <Map />,
    agricultural: <Trees />,
};

export const PROPERTY_TYPE_ICONS: Record<PropertyType, ReactNode> = {
    apartment: <Building2 />,
    villa: <Home />,
    independent_house: <Home />,
    builder_floor: <LayoutPanelTop />,
    penthouse: <Hotel />,
    farmhouse: <Trees />,
    flat: <Building />,
    shop: <Store />,
    office: <Building2 />,
    showroom: <Store />,
    warehouse: <Warehouse />,
    factory: <Factory />,
    plot: <Map />,
    agricultural: <Landmark />,
};

/** Every BHK step uses the same glyph — the number carries the meaning. */
export function bhkIcon(): ReactNode {
    return <Bed />;
}
