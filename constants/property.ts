export type PropertyOption<T extends string = string> = {
    value: T;
    label: string;
    description?: string;
};

export const LISTING_FOR_OPTIONS = [
    { value: "sell", label: "Sell", description: "Find a buyer" },
    { value: "rent", label: "Rent", description: "Find a tenant" },
] as const satisfies readonly PropertyOption[];

export const PROPERTY_CATEGORY_OPTIONS = [
    { value: "residential", label: "Residential" },
    { value: "commercial", label: "Commercial" },
    { value: "land", label: "Land" },
    { value: "industrial", label: "Industrial" },
    { value: "agricultural", label: "Agricultural" },
] as const satisfies readonly PropertyOption[];

export const PROPERTY_TYPES = {
    residential: [
        "apartment",
        "independent_house",
        "villa",
        "builder_floor",
        "row_house",
        "penthouse",
        "studio",
        "serviced_apartment",
        "1rk",
        "farm_house",
        "duplex",
    ],
    commercial: [
        "office_space",
        "coworking_space",
        "shop",
        "showroom",
        "retail_space",
        "warehouse",
        "godown",
        "industrial_shed",
        "factory",
        "restaurant_space",
        "hotel_resort",
        "commercial_building",
        "business_center",
    ],
    land: [
        "residential_plot",
        "commercial_plot",
        "industrial_plot",
        "agricultural_land",
        "farm_land",
        "na_plot",
    ],
    industrial: ["factory", "industrial_shed", "industrial_plot", "cold_storage"],
    agricultural: ["agricultural_land", "farm_land", "orchard", "poultry_farm"],
} as const;

export type ListingFor = (typeof LISTING_FOR_OPTIONS)[number]["value"];
export type PropertyCategory = (typeof PROPERTY_CATEGORY_OPTIONS)[number]["value"];
export type PropertyType = (typeof PROPERTY_TYPES)[PropertyCategory][number];

export const PROPERTY_SUBTYPE_OPTIONS = [
    { value: "simplex", label: "Simplex" },
    { value: "duplex", label: "Duplex" },
    { value: "studio", label: "Studio" },
    { value: "1rk", label: "1 RK" },
    { value: "penthouse", label: "Penthouse" },
] as const satisfies readonly PropertyOption[];

export const TRANSACTION_TYPE_OPTIONS = [
    { value: "new_booking", label: "New booking" },
    { value: "resale", label: "Resale" },
] as const satisfies readonly PropertyOption[];

export const INDIAN_STATE_OPTIONS = [
    { value: "Gujarat", label: "Gujarat" },
    { value: "Maharashtra", label: "Maharashtra" },
    { value: "Rajasthan", label: "Rajasthan" },
    { value: "Madhya Pradesh", label: "Madhya Pradesh" },
    { value: "Delhi", label: "Delhi" },
] as const satisfies readonly PropertyOption[];

export const CITY_OPTIONS = [
    { value: "Surat", label: "Surat" },
    { value: "Ahmedabad", label: "Ahmedabad" },
    { value: "Vadodara", label: "Vadodara" },
    { value: "Rajkot", label: "Rajkot" },
] as const satisfies readonly PropertyOption[];

export const SURAT_LOCALITY_OPTIONS = [
    { value: "Vesu", label: "Vesu" },
    { value: "Adajan", label: "Adajan" },
    { value: "Althan", label: "Althan" },
    { value: "City Light", label: "City Light" },
    { value: "Piplod", label: "Piplod" },
    { value: "Pal", label: "Pal" },
    { value: "Katargam", label: "Katargam" },
] as const satisfies readonly PropertyOption[];

export const NEARBY_PLACE_TYPE_OPTIONS = [
    "metro",
    "bus_stop",
    "railway",
    "airport",
    "school",
    "college",
    "hospital",
    "mall",
    "market",
    "park",
    "bank_atm",
    "highway",
    "it_park",
    "temple",
    "petrol_pump",
    "gym",
    "restaurant",
    "police_station",
].map((value) => ({ value, label: toLabel(value) }));

export const BEDROOM_OPTIONS = [
    "1rk",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "10_plus",
].map((value) => ({
    value,
    label: value === "1rk" ? "1 RK" : value === "10_plus" ? "10+" : `${value} BHK`,
}));

export const FLOOR_OPTIONS = [
    { value: "basement", label: "Basement" },
    { value: "lower_ground", label: "Lower ground" },
    { value: "ground", label: "Ground" },
    ...Array.from({ length: 50 }, (_, index) => ({
        value: String(index + 1),
        label: `Floor ${index + 1}`,
    })),
    { value: "top_floor", label: "Top floor" },
] satisfies PropertyOption[];

export const FACING_OPTIONS = [
    { value: "north", label: "North" },
    { value: "north_east", label: "North-east" },
    { value: "east", label: "East" },
    { value: "south_east", label: "South-east" },
    { value: "south", label: "South" },
    { value: "south_west", label: "South-west" },
    { value: "west", label: "West" },
    { value: "north_west", label: "North-west" },
] as const satisfies readonly PropertyOption[];

export const PROPERTY_AGE_OPTIONS = [
    { value: "new", label: "New" },
    { value: "0_1", label: "Less than 1 year" },
    { value: "1_5", label: "1–5 years" },
    { value: "5_10", label: "5–10 years" },
    { value: "10_15", label: "10–15 years" },
    { value: "15_20", label: "15–20 years" },
    { value: "20_plus", label: "20+ years" },
] as const satisfies readonly PropertyOption[];

export const PROPERTY_CONDITION_OPTIONS = [
    { value: "ready_to_move", label: "Ready to move" },
    { value: "under_construction", label: "Under construction" },
    { value: "needs_renovation", label: "Needs renovation" },
    { value: "new_launch", label: "New launch" },
] as const satisfies readonly PropertyOption[];

export const WASHROOM_TYPE_OPTIONS = ["private", "shared", "both"].map((value) => ({
    value,
    label: toLabel(value),
}));
export const PANTRY_TYPE_OPTIONS = ["none", "dry", "wet", "cafeteria"].map((value) => ({
    value,
    label: toLabel(value),
}));
export const SUITABLE_FOR_OPTIONS = [
    "office",
    "retail",
    "clinic",
    "restaurant",
    "showroom",
    "warehouse",
    "salon",
    "gym",
    "bank",
    "school",
    "hostel",
].map((value) => ({ value, label: toLabel(value) }));
export const OPEN_SIDE_OPTIONS = ["1", "2", "3", "4"].map((value) => ({ value, label: value }));
export const ZONING_TYPE_OPTIONS = [
    "residential",
    "commercial",
    "industrial",
    "agricultural",
    "mixed",
].map((value) => ({ value, label: toLabel(value) }));
export const APPROVED_BY_OPTIONS = ["smc", "suda", "auda", "gram_panchayat", "other"].map(
    (value) => ({ value, label: value.toUpperCase().replace("_", " ") }),
);
export const SOIL_TYPE_OPTIONS = [
    "black",
    "alluvial",
    "red",
    "sandy",
    "clay",
    "mixed",
    "unknown",
].map((value) => ({ value, label: toLabel(value) }));
export const WATER_AVAILABILITY_OPTIONS = [
    "none",
    "seasonal",
    "borewell",
    "canal",
    "year_round",
].map((value) => ({ value, label: toLabel(value) }));

export const AREA_UNIT_OPTIONS = [
    { value: "sqft", label: "sq ft" },
    { value: "sqin", label: "sq in" },
    { value: "sqyd", label: "sq yd" },
    { value: "sqmi", label: "sq mi" },
    { value: "acre", label: "Acre" },
    { value: "sqmm", label: "sq mm" },
    { value: "sqcm", label: "sq cm" },
    { value: "sqm", label: "sq m" },
    { value: "sqkm", label: "sq km" },
    { value: "are", label: "Are" },
    { value: "hectare", label: "Hectare" },
] as const satisfies readonly PropertyOption[];

export const MAINTENANCE_FREQUENCY_OPTIONS = [
    "monthly",
    "quarterly",
    "yearly",
    "one_time",
    "per_sqft_monthly",
].map((value) => ({ value, label: toLabel(value) }));
export const PAID_BY_OPTIONS = [
    { value: "owner", label: "Owner" },
    { value: "buyer", label: "Buyer" },
] as const satisfies readonly PropertyOption[];
export const SECURITY_DEPOSIT_MODE_OPTIONS = [
    { value: "amount", label: "Fixed amount" },
    { value: "months_of_rent", label: "Months of rent" },
] as const satisfies readonly PropertyOption[];
export const MAINTENANCE_MODE_OPTIONS = [
    { value: "included_in_rent", label: "Included in rent" },
    { value: "extra", label: "Paid separately" },
] as const satisfies readonly PropertyOption[];
export const ELECTRICITY_BILLING_OPTIONS = ["separate_meter", "included", "shared"].map(
    (value) => ({ value, label: toLabel(value) }),
);
export const WATER_CHARGE_OPTIONS = ["included", "extra"].map((value) => ({
    value,
    label: toLabel(value),
}));
export const AGREEMENT_DURATION_OPTIONS = ["11", "12", "24", "36", "60"].map((value) => ({
    value,
    label: `${value} months`,
}));
export const PREFERRED_TENANT_OPTIONS = [
    "family",
    "bachelor_male",
    "bachelor_female",
    "company",
    "students",
    "anyone",
].map((value) => ({ value, label: toLabel(value) }));
export const CURRENT_STATUS_OPTIONS = ["vacant", "owner_occupied", "tenant_occupied"].map(
    (value) => ({ value, label: toLabel(value) }),
);
export const PG_BED_TYPE_OPTIONS = ["single", "double", "triple", "dorm"].map((value) => ({
    value,
    label: toLabel(value),
}));
export const PG_GENDER_OPTIONS = ["male", "female", "any"].map((value) => ({
    value,
    label: toLabel(value),
}));
export const HOUSEKEEPING_OPTIONS = ["daily", "alternate_days", "weekly", "none"].map((value) => ({
    value,
    label: toLabel(value),
}));


export const FURNISHING_OPTIONS = [
    { value: "unfurnished", label: "Unfurnished" },
    { value: "semi_furnished", label: "Semi-furnished" },
    { value: "fully_furnished", label: "Fully furnished" },
] as const satisfies readonly PropertyOption[];
export const FURNISHING_ITEM_OPTIONS = [
    "beds",
    "wardrobe",
    "sofa",
    "dining_table",
    "chairs",
    "study_table",
    "dressing_table",
    "tv",
    "tv_unit",
    "fridge",
    "washing_machine",
    "microwave",
    "water_purifier",
    "geyser",
    "ac",
    "fan",
    "light_fixtures",
    "curtains",
    "modular_kitchen",
    "chimney",
    "stove",
    "exhaust_fan",
    "shoe_rack",
    "bookshelf",
    "mirror",
    "gas_pipeline",
    "sofa_cum_bed",
    "air_cooler",
    "inverter",
    "dishwasher",
    "crockery_unit",
    "false_ceiling",
].map((value) => ({ value, label: toLabel(value) }));
export const COMMERCIAL_FURNISHING_ITEMS = new Set([
    "sofa",
    "chairs",
    "tv",
    "fridge",
    "microwave",
    "water_purifier",
    "ac",
    "fan",
    "light_fixtures",
    "curtains",
    "inverter",
    "false_ceiling",
]);
export const SOCIETY_AMENITIES = [
    "lift",
    "power_backup",
    "security_guard",
    "cctv",
    "gated_community",
    "intercom",
    "visitor_parking",
    "fire_safety",
    "water_storage",
    "rain_water_harvesting",
    "waste_disposal",
    "maintenance_staff",
    "sewage_treatment",
    "piped_gas",
    "solar_panel",
    "ev_charging",
    "service_lift",
    "entrance_lobby",
    "street_lighting",
] as const;
export const RECREATION_AMENITIES = [
    "swimming_pool",
    "gym",
    "clubhouse",
    "kids_play_area",
    "park_garden",
    "jogging_track",
    "indoor_games",
    "sports_court",
    "badminton_court",
    "cricket_pitch",
    "amphitheatre",
    "party_hall",
    "multipurpose_hall",
    "yoga_area",
    "pet_area",
    "senior_citizen_area",
    "bbq_area",
    "cycling_track",
    "swimming_pool_kids",
] as const;
export const CONVENIENCE_AMENITIES = [
    "grocery_shop",
    "atm",
    "cafeteria",
    "salon",
    "creche",
    "library",
    "laundry",
    "guest_room",
    "conference_room",
    "coworking_space",
    "temple",
    "medical_store",
    "ambulance_on_call",
    "shuttle_service",
    "car_wash",
] as const;
export const FLAT_FEATURES = [
    "modular_kitchen",
    "wooden_flooring",
    "private_terrace",
    "private_garden",
    "servant_quarter",
    "study_room",
    "pooja_room",
    "store_room",
    "false_ceiling",
    "water_purifier",
    "ac_installed",
    "high_ceiling",
    "walk_in_wardrobe",
    "attached_balcony",
    "separate_entry",
    "natural_light",
    "cross_ventilation",
] as const;
export const COMMERCIAL_AMENITIES = [
    "central_ac",
    "dg_backup",
    "reception_area",
    "pantry",
    "server_room",
    "cafeteria",
    "passenger_lift",
    "service_lift",
    "loading_dock",
    "fire_noc",
    "sprinkler_system",
    "cctv",
    "24x7_access",
    "staff_parking",
    "visitor_parking",
    "ups_room",
] as const;
export const LAND_FEATURES = [
    "boundary_wall",
    "corner_plot",
    "road_access",
    "electricity_connection",
    "water_connection",
    "gated_layout",
] as const;

export const POSSESSION_TYPE_OPTIONS = [
    "immediate",
    "within_3m",
    "within_6m",
    "within_1y",
    "custom_date",
].map((value) => ({ value, label: toLabel(value) }));
export const PAYMENT_PLAN_OPTIONS = [
    "clp",
    "down_payment",
    "flexi",
    "subvention",
    "possession_linked",
].map((value) => ({ value, label: toLabel(value) }));

export const PHOTO_TAG_OPTIONS = [
    "living_room",
    "bedroom",
    "kitchen",
    "bathroom",
    "balcony",
    "dining",
    "exterior",
    "building",
    "entrance",
    "parking",
    "amenities",
    "view",
    "night_view",
    "floor_plan",
    "master_plan",
    "location_map",
    "other",
    "plot_view",
    "road_access",
    "frontage",
    "interior",
].map((value) => ({ value, label: toLabel(value) }));
export const DOCUMENT_TYPE_OPTIONS = [
    "sale_deed",
    "index_2",
    "7_12_extract",
    "property_card",
    "na_order",
    "approved_plan",
    "building_use_permission",
    "property_tax_receipt",
    "electricity_bill",
    "society_noc",
    "share_certificate",
    "encumbrance_certificate",
    "rera_certificate",
    "occupancy_certificate",
    "completion_certificate",
    "mutation_entry",
    "owner_id_proof",
    "mandate_letter",
    "existing_rent_agreement",
    "loan_noc",
    "possession_letter",
    "8a_extract",
    "allotment_letter",
    "builder_agreement",
    "survey_map",
    "property_ownership_proof",
    "fire_noc",
].map((value) => ({ value, label: toLabel(value) }));

export const LISTER_TYPE_OPTIONS = [
    { value: "owner", label: "Owner" },
    { value: "builder", label: "Builder" },
    { value: "agent", label: "Broker" },
    { value: "society", label: "Society" },
    { value: "poa_holder", label: "Power of attorney holder" },
] as const satisfies readonly PropertyOption[];
export const CONTACT_TIME_OPTIONS = ["morning", "afternoon", "evening", "anytime"].map((value) => ({
    value,
    label: toLabel(value),
}));
export const LANGUAGE_OPTIONS = ["gujarati", "hindi", "english", "marathi"].map((value) => ({
    value,
    label: toLabel(value),
}));
export const LISTING_STATUS_OPTIONS = [
    "draft",
    "pending_verification",
    "active",
    "on_hold",
    "under_negotiation",
    "token_received",
    "sold",
    "rented",
    "expired",
    "rejected",
    "archived",
].map((value) => ({ value, label: toLabel(value) }));
export const VISIBILITY_OPTIONS = [
    { value: "public", label: "Public", description: "Visible to approved brokers" },
    { value: "my_clients_only", label: "My clients only", description: "Keep it within your CRM" },
    { value: "private", label: "Private", description: "Only you can see it" },
] as const satisfies readonly PropertyOption[];
export const CONTACT_DISPLAY_OPTIONS = [
    { value: "show_owner_number", label: "Show owner number" },
    { value: "route_through_broker", label: "Route calls through broker" },
] as const satisfies readonly PropertyOption[];

export const PAYMENT_MILESTONE_TEMPLATE = [
    { stage: "Token / booking", percent: 10 },
    { stage: "Agreement to sell", percent: 40 },
    { stage: "Registration", percent: 50 },
] as const;

export const FORM_STEPS = [
    { id: "basics", label: "Basics", shortLabel: "Basics" },
    { id: "location", label: "Location", shortLabel: "Location" },
    { id: "details", label: "Property details", shortLabel: "Details" },
    { id: "area", label: "Area & measurement", shortLabel: "Area" },
    { id: "pricing", label: "Price & charges", shortLabel: "Price" },
    { id: "commission", label: "Commission deal", shortLabel: "Deal" },
    { id: "furnishing", label: "Furnishing & amenities", shortLabel: "Amenities" },
    { id: "highlights", label: "Highlights & availability", shortLabel: "Highlights" },
    { id: "media", label: "Media & documents", shortLabel: "Media" },
    { id: "publish", label: "Owner & publish", shortLabel: "Publish" },
] as const;

export type PropertyFormStep = (typeof FORM_STEPS)[number]["id"];

export function toLabel(value: string): string {
    return value
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase())
        .replace("24x7", "24×7");
}

export function propertyTypeOptions(category: PropertyCategory): PropertyOption[] {
    return PROPERTY_TYPES[category].map((value) => ({ value, label: toLabel(value) }));
}

export function optionList(values: readonly string[]): PropertyOption[] {
    return values.map((value) => ({ value, label: toLabel(value) }));
}
