import type { ReactNode } from "react";

import {
    Armchair,
    Baby,
    Bed,
    Bike,
    BookOpen,
    Building,
    Building2,
    Bus,
    Camera,
    Car,
    CheckCircle2,
    Church,
    CloudSun,
    DoorOpen,
    Droplets,
    Dumbbell,
    Factory,
    Fence,
    Flame,
    Gamepad2,
    HandCoins,
    Home,
    Hotel,
    KeyRound,
    Landmark,
    LayoutPanelTop,
    Leaf,
    Library,
    Map,
    Package,
    ParkingCircle,
    PawPrint,
    PersonStanding,
    Pill,
    Repeat,
    Scissors,
    Server,
    Shield,
    Shirt,
    ShoppingBag,
    Sofa,
    Sparkles,
    Store,
    Sun,
    Trees,
    Truck,
    Users,
    UtensilsCrossed,
    Warehouse,
    Waves,
    Wind,
    Zap,
} from "lucide-react";

import type { PropertyCategory, PropertyFormValues, PropertyType } from "@/lib/validation/property";

import type { ListingFor } from "@/constants/property";

/** Deal type — sale, rent, or both. */
export const TRANSACTION_TYPE_ICONS: Record<PropertyFormValues["transactionType"], ReactNode> = {
    sale: <HandCoins />,
    rent: <KeyRound />,
    both: <Repeat />,
};

export const LISTING_FOR_ICONS: Record<ListingFor, ReactNode> = {
    sell: <HandCoins />,
    rent: <KeyRound />,
    both: <Repeat />,
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

export const FURNISHING_ICONS: Record<string, ReactNode> = {
    unfurnished: <Package />,
    semi_furnished: <Armchair />,
    fully_furnished: <Sofa />,
};

/** Icons for amenity chips — unknown keys fall back to Sparkles. */
export const AMENITY_ICONS: Partial<Record<string, ReactNode>> = {
    // Society
    lift: <Building2 />,
    power_backup: <Zap />,
    security_guard: <Shield />,
    cctv: <Camera />,
    gated_community: <Fence />,
    intercom: <Users />,
    visitor_parking: <Car />,
    fire_safety: <Flame />,
    water_storage: <Droplets />,
    rain_water_harvesting: <CloudSun />,
    waste_disposal: <Leaf />,
    maintenance_staff: <PersonStanding />,
    sewage_treatment: <Droplets />,
    piped_gas: <Flame />,
    solar_panel: <Sun />,
    ev_charging: <Zap />,
    service_lift: <Building2 />,
    entrance_lobby: <DoorOpen />,
    street_lighting: <Sun />,
    // Recreation
    swimming_pool: <Waves />,
    gym: <Dumbbell />,
    clubhouse: <Building />,
    kids_play_area: <Baby />,
    park_garden: <Trees />,
    jogging_track: <PersonStanding />,
    indoor_games: <Gamepad2 />,
    sports_court: <Dumbbell />,
    badminton_court: <Dumbbell />,
    cricket_pitch: <Trees />,
    amphitheatre: <Users />,
    party_hall: <Users />,
    multipurpose_hall: <Building />,
    yoga_area: <PersonStanding />,
    pet_area: <PawPrint />,
    senior_citizen_area: <PersonStanding />,
    bbq_area: <Flame />,
    cycling_track: <Bike />,
    swimming_pool_kids: <Waves />,
    // Convenience
    grocery_shop: <ShoppingBag />,
    atm: <Landmark />,
    cafeteria: <UtensilsCrossed />,
    salon: <Scissors />,
    creche: <Baby />,
    library: <Library />,
    laundry: <Shirt />,
    guest_room: <Bed />,
    conference_room: <Users />,
    coworking_space: <Building2 />,
    temple: <Church />,
    medical_store: <Pill />,
    ambulance_on_call: <Truck />,
    shuttle_service: <Bus />,
    car_wash: <Car />,
    // Flat features
    modular_kitchen: <UtensilsCrossed />,
    wooden_flooring: <Home />,
    private_terrace: <Sun />,
    private_garden: <Trees />,
    servant_quarter: <Home />,
    study_room: <BookOpen />,
    pooja_room: <Church />,
    store_room: <Package />,
    false_ceiling: <Home />,
    water_purifier: <Droplets />,
    ac_installed: <Wind />,
    high_ceiling: <Home />,
    walk_in_wardrobe: <Shirt />,
    attached_balcony: <DoorOpen />,
    separate_entry: <DoorOpen />,
    // Commercial
    central_ac: <Wind />,
    dg_backup: <Zap />,
    reception_area: <Users />,
    pantry: <UtensilsCrossed />,
    server_room: <Server />,
    passenger_lift: <Building2 />,
    loading_dock: <Truck />,
    fire_noc: <CheckCircle2 />,
    sprinkler_system: <Droplets />,
    "24x7_access": <KeyRound />,
    staff_parking: <ParkingCircle />,
    ups_room: <Zap />,
};

/** Fallback glyph when an amenity has no mapped icon. */
export const AMENITY_FALLBACK_ICON: ReactNode = <Sparkles />;

/** Every BHK step uses the same glyph — the number carries the meaning. */
export function bhkIcon(): ReactNode {
    return <Bed />;
}
