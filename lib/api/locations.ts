import { apiFetch } from "@/lib/api/client";
import { isMockMode } from "@/lib/api/mock-mode";

export type CountryItem = {
    id: string;
    name: string;
    iso2: string;
    iso3: string | null;
    phoneCode: string | null;
    emoji: string | null;
    /** Countries the product operates in — sorted first by the API. */
    isSupported: boolean;
    /** True when states + cities are fully stored server-side. */
    isReady: boolean;
};

export type StateItem = {
    id: string;
    name: string;
    code: string | null;
    citiesReady: boolean;
};

export type CityItem = {
    id: string;
    name: string;
};

export type CitySearchItem = CityItem & {
    stateName: string;
};

export type LocalityItem = {
    id: string;
    name: string;
    /** Google's secondary line, e.g. "Surat, Gujarat, India". */
    description: string | null;
};

type CountriesResponse = { items: CountryItem[] };
type StatesResponse = { country: CountryItem; importStatus: string; items: StateItem[] };
type CitiesResponse = { state: StateItem; items: CityItem[] };
type CitySearchResponse = { items: CitySearchItem[] };
type LocalitiesResponse = {
    city: { id: string; name: string };
    source: "db" | "google";
    items: LocalityItem[];
};

/**
 * Design-mode fixtures. Kept to the launch country only — the real list comes
 * from the API, which imports a country's states and cities on first use.
 */
const MOCK_COUNTRIES: CountryItem[] = [
    {
        id: "country-in",
        name: "India",
        iso2: "IN",
        iso3: "IND",
        phoneCode: "91",
        emoji: "🇮🇳",
        isSupported: true,
        isReady: true,
    },
];

const MOCK_STATES: StateItem[] = [
    { id: "state-gj", name: "Gujarat", code: "GJ", citiesReady: true },
    { id: "state-mh", name: "Maharashtra", code: "MH", citiesReady: true },
    { id: "state-rj", name: "Rajasthan", code: "RJ", citiesReady: true },
    { id: "state-mp", name: "Madhya Pradesh", code: "MP", citiesReady: true },
    { id: "state-dl", name: "Delhi", code: "DL", citiesReady: true },
];

const MOCK_CITIES: Record<string, CityItem[]> = {
    "state-gj": [
        { id: "city-surat", name: "Surat" },
        { id: "city-ahmedabad", name: "Ahmedabad" },
        { id: "city-vadodara", name: "Vadodara" },
        { id: "city-rajkot", name: "Rajkot" },
    ],
    "state-mh": [
        { id: "city-mumbai", name: "Mumbai" },
        { id: "city-pune", name: "Pune" },
        { id: "city-nagpur", name: "Nagpur" },
    ],
    "state-rj": [
        { id: "city-jaipur", name: "Jaipur" },
        { id: "city-udaipur", name: "Udaipur" },
    ],
    "state-mp": [
        { id: "city-indore", name: "Indore" },
        { id: "city-bhopal", name: "Bhopal" },
    ],
    "state-dl": [{ id: "city-new-delhi", name: "New Delhi" }],
};

const MOCK_LOCALITIES: Record<string, string[]> = {
    "city-surat": [
        "Adajan",
        "Althan",
        "Athwa",
        "Bhatar",
        "Citylight",
        "Katargam",
        "Pal",
        "Piplod",
        "Varachha",
        "Vesu",
    ],
    "city-ahmedabad": [
        "Bodakdev",
        "Bopal",
        "Maninagar",
        "Navrangpura",
        "Prahlad Nagar",
        "Satellite",
    ],
    "city-mumbai": ["Andheri West", "Bandra West", "Borivali", "Malad", "Powai", "Thane West"],
    "city-pune": ["Baner", "Hinjewadi", "Kothrud", "Viman Nagar", "Wakad"],
};

function matchesSearch(name: string, search: string | undefined): boolean {
    const needle = search?.trim().toLowerCase();
    return !needle || name.toLowerCase().includes(needle);
}

export const locationsApi = {
    async countries(options: { supportedOnly?: boolean } = {}): Promise<CountryItem[]> {
        if (isMockMode()) return MOCK_COUNTRIES;

        const search = new URLSearchParams();
        if (options.supportedOnly) search.set("supportedOnly", "true");
        const query = search.toString();

        const response = await apiFetch<CountriesResponse>(
            `/locations/countries${query ? `?${query}` : ""}`,
        );
        return response.items ?? [];
    },

    /**
     * All states of a country. The first call for a country the backend has not
     * seen imports it from the provider, so this can take a moment once.
     */
    async states(countryIso2: string): Promise<StateItem[]> {
        if (isMockMode()) return MOCK_STATES;

        const response = await apiFetch<StatesResponse>(
            `/locations/countries/${encodeURIComponent(countryIso2)}/states`,
        );
        return response.items ?? [];
    },

    /** All cities of a state. */
    async cities(stateId: string): Promise<CityItem[]> {
        if (isMockMode()) return MOCK_CITIES[stateId] ?? [];

        const response = await apiFetch<CitiesResponse>(
            `/locations/states/${encodeURIComponent(stateId)}/cities`,
        );
        return response.items ?? [];
    },

    /**
     * Cities across a whole country, for city fields with no state picker.
     * Each row carries its state so two same-named cities can be told apart.
     */
    async searchCities(
        countryIso2: string,
        options: { search?: string; limit?: number } = {},
    ): Promise<CitySearchItem[]> {
        if (isMockMode()) {
            return MOCK_STATES.flatMap((state) =>
                (MOCK_CITIES[state.id] ?? []).map((city) => ({ ...city, stateName: state.name })),
            )
                .filter((city) => matchesSearch(city.name, options.search))
                .slice(0, options.limit ?? 20);
        }

        const search = new URLSearchParams();
        if (options.search?.trim()) search.set("search", options.search.trim());
        if (options.limit) search.set("limit", String(options.limit));
        const query = search.toString();

        const response = await apiFetch<CitySearchResponse>(
            `/locations/countries/${encodeURIComponent(countryIso2)}/cities${query ? `?${query}` : ""}`,
        );
        return response.items ?? [];
    },

    /**
     * Locality autocomplete for a city. The backend answers from its own table
     * and only asks Google Maps when nothing stored matches the search.
     */
    async localities(
        cityId: string,
        options: { search?: string; limit?: number } = {},
    ): Promise<LocalityItem[]> {
        if (isMockMode()) {
            return (MOCK_LOCALITIES[cityId] ?? [])
                .filter((name) => matchesSearch(name, options.search))
                .slice(0, options.limit ?? 20)
                .map((name) => ({ id: `${cityId}-${name}`, name, description: null }));
        }

        const search = new URLSearchParams();
        if (options.search?.trim()) search.set("search", options.search.trim());
        if (options.limit) search.set("limit", String(options.limit));
        const query = search.toString();

        const response = await apiFetch<LocalitiesResponse>(
            `/locations/cities/${encodeURIComponent(cityId)}/localities${query ? `?${query}` : ""}`,
        );
        return response.items ?? [];
    },
};
