export const SURAT_LOCALITIES = [
    "Adajan",
    "Vesu",
    "Piplod",
    "Pal",
    "Athwa",
    "Ghod Dod Road",
    "Katargam",
    "Ring Road",
    "Bhatar",
    "City Light",
    "Althan",
    "Dumas Road",
    "Varachha",
    "Udhna",
    "Amroli",
    "Pandesara",
] as const;

export const PROPERTY_TYPES = [
    "Apartment",
    "Villa",
    "Row House",
    "Bungalow",
    "Plot",
    "Office",
    "Shop",
    "Showroom",
    "Warehouse",
] as const;

export const BHK_OPTIONS = ["1 RK", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "4+ BHK"] as const;
export const AMENITIES = [
    "Lift",
    "Power backup",
    "Gym",
    "Swimming pool",
    "Clubhouse",
    "Security",
    "Garden",
    "Kids play area",
    "CCTV",
    "Visitor parking",
] as const;
export const COMMERCIAL_TYPES = new Set(["Office", "Shop", "Showroom", "Warehouse"]);

export type BuyerContactForm = {
    name: string;
    phone: string;
    whatsapp: string;
    whatsappSame: boolean;
    altPhone: string;
    email: string;
    buyerType: string;
    intent: "buy" | "rent";
    propertyTypes: string[];
    configurations: string[];
    budgetMin: string;
    budgetMax: string;
    budgetUnit: "lakh" | "crore";
    areaMin: string;
    areaMax: string;
    areaUnit: string;
    localities: string[];
    furnishing: string[];
    timeline: string;
    purpose: string;
    parking: string;
    facing: string[];
    floorPreference: string;
    vastu: boolean;
    amenities: string[];
    loanStatus: string;
    loanAmount: string;
    tokenReady: boolean;
    brokerageType: "percentage" | "flat";
    brokerageValue: string;
    source: string;
    referredBy: string;
    stage: string;
    priority: "hot" | "warm" | "cold";
    assignedTo: string;
    lastSpokeAt: string;
    nextFollowUpAt: string;
    tags: string[];
    notes: string;
};

export type OwnerContactForm = {
    name: string;
    phone: string;
    whatsapp: string;
    whatsappSame: boolean;
    altPhone: string;
    email: string;
    ownerType: string;
    address: string;
    idProof: File | null;
    intent: "sell" | "rent" | "lease";
    propertyType: string;
    configuration: string;
    societyName: string;
    locality: string;
    fullAddress: string;
    city: string;
    pincode: string;
    lat: string;
    lng: string;
    carpetArea: string;
    builtUpArea: string;
    superBuiltUpArea: string;
    plotArea: string;
    areaUnit: string;
    floorNumber: string;
    totalFloors: string;
    bathrooms: string;
    balconies: string;
    parkingType: string;
    parkingCount: string;
    facing: string;
    propertyAge: string;
    availableFrom: string;
    furnishing: string;
    amenities: string[];
    reraNumber: string;
    photos: File[];
    documents: File[];
    expectedPrice: string;
    priceUnit: "lakh" | "crore";
    expectedRent: string;
    deposit: string;
    maintenance: string;
    negotiable: boolean;
    exclusive: boolean;
    agreementValidTill: string;
    brokerageType: "percentage" | "flat";
    brokerageValue: string;
    brokeragePaidBy: string;
    visitDays: string[];
    visitFrom: string;
    visitTo: string;
    source: string;
    status: string;
    lastSpokeAt: string;
    nextFollowUpAt: string;
    tags: string[];
    notes: string;
    createPrivateListing: boolean;
};

const today = () => new Date().toISOString().slice(0, 10);

export function emptyBuyerForm(): BuyerContactForm {
    return {
        name: "",
        phone: "",
        whatsapp: "",
        whatsappSame: true,
        altPhone: "",
        email: "",
        buyerType: "individual",
        intent: "buy",
        propertyTypes: [],
        configurations: [],
        budgetMin: "",
        budgetMax: "",
        budgetUnit: "lakh",
        areaMin: "",
        areaMax: "",
        areaUnit: "sq ft",
        localities: [],
        furnishing: [],
        timeline: "",
        purpose: "",
        parking: "",
        facing: [],
        floorPreference: "",
        vastu: false,
        amenities: [],
        loanStatus: "not_required",
        loanAmount: "",
        tokenReady: false,
        brokerageType: "percentage",
        brokerageValue: "",
        source: "",
        referredBy: "",
        stage: "new",
        priority: "warm",
        assignedTo: "me",
        lastSpokeAt: today(),
        nextFollowUpAt: "",
        tags: [],
        notes: "",
    };
}

export function emptyOwnerForm(): OwnerContactForm {
    return {
        name: "",
        phone: "",
        whatsapp: "",
        whatsappSame: true,
        altPhone: "",
        email: "",
        ownerType: "individual",
        address: "",
        idProof: null,
        intent: "sell",
        propertyType: "Apartment",
        configuration: "",
        societyName: "",
        locality: "",
        fullAddress: "",
        city: "Surat",
        pincode: "",
        lat: "",
        lng: "",
        carpetArea: "",
        builtUpArea: "",
        superBuiltUpArea: "",
        plotArea: "",
        areaUnit: "sq ft",
        floorNumber: "",
        totalFloors: "",
        bathrooms: "",
        balconies: "",
        parkingType: "none",
        parkingCount: "0",
        facing: "",
        propertyAge: "",
        availableFrom: "",
        furnishing: "",
        amenities: [],
        reraNumber: "",
        photos: [],
        documents: [],
        expectedPrice: "",
        priceUnit: "lakh",
        expectedRent: "",
        deposit: "",
        maintenance: "",
        negotiable: false,
        exclusive: false,
        agreementValidTill: "",
        brokerageType: "percentage",
        brokerageValue: "",
        brokeragePaidBy: "owner",
        visitDays: [],
        visitFrom: "",
        visitTo: "",
        source: "",
        status: "active",
        lastSpokeAt: today(),
        nextFollowUpAt: "",
        tags: [],
        notes: "",
        createPrivateListing: true,
    };
}

export function normalizeIndianPhone(value: string): string {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
    return digits;
}

export function moneyToRupees(value: string, unit?: "lakh" | "crore"): number {
    const amount = Number(value.replace(/,/g, ""));
    if (!Number.isFinite(amount)) return 0;
    if (unit === "crore") return Math.round(amount * 10_000_000);
    if (unit === "lakh") return Math.round(amount * 100_000);
    return Math.round(amount);
}

export function showBuyerBhk(values: BuyerContactForm): boolean {
    if (!values.propertyTypes.length) return true;
    return !values.propertyTypes.every((type) => type === "Plot" || COMMERCIAL_TYPES.has(type));
}

export function showOwnerBhk(values: OwnerContactForm): boolean {
    return values.propertyType !== "Plot" && !COMMERCIAL_TYPES.has(values.propertyType);
}

type Errors = Record<string, string>;
const validPhone = (value: string) => /^[6-9]\d{9}$/.test(normalizeIndianPhone(value));
const validEmail = (value: string) =>
    !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function validateBuyerStep(values: BuyerContactForm, step: number): Errors {
    const errors: Errors = {};
    if (step === 0) {
        if (values.name.trim().length < 2) errors.name = "Enter at least 2 characters";
        if (!validPhone(values.phone)) errors.phone = "Enter a valid 10-digit mobile number";
        if (!values.whatsappSame && values.whatsapp && !validPhone(values.whatsapp))
            errors.whatsapp = "Enter a valid 10-digit WhatsApp number";
        if (values.altPhone && !validPhone(values.altPhone))
            errors.altPhone = "Enter a valid 10-digit alternate number";
        if (!validEmail(values.email)) errors.email = "Enter a valid email address";
    }
    if (step === 1) {
        if (!values.propertyTypes.length)
            errors.propertyTypes = "Choose at least one property type";
        if (showBuyerBhk(values) && !values.configurations.length)
            errors.configurations = "Choose at least one configuration";
        if (!values.budgetMin)
            errors.budgetMin =
                values.intent === "rent" ? "Enter minimum rent" : "Enter minimum budget";
        if (!values.budgetMax)
            errors.budgetMax =
                values.intent === "rent" ? "Enter maximum rent" : "Enter maximum budget";
        const min = moneyToRupees(
            values.budgetMin,
            values.intent === "buy" ? values.budgetUnit : undefined,
        );
        const max = moneyToRupees(
            values.budgetMax,
            values.intent === "buy" ? values.budgetUnit : undefined,
        );
        if (min > 0 && max > 0 && max < min)
            errors.budgetMax = "Maximum must be at least the minimum";
        if (values.propertyTypes.includes("Plot") && !values.areaMin && !values.areaMax)
            errors.areaMin = "Add the plot area";
        if (!values.localities.length) errors.localities = "Add at least one locality";
    }
    if (step === 2 && values.loanStatus === "required" && !values.loanAmount)
        errors.loanAmount = "Enter the loan amount needed";
    if (step === 3) {
        if (!values.source) errors.source = "Choose a lead source";
        if (values.source === "reference" && !values.referredBy.trim())
            errors.referredBy = "Enter who referred this buyer";
        if (!values.stage) errors.stage = "Choose a lead stage";
    }
    return errors;
}

export function validateOwnerStep(values: OwnerContactForm, step: number): Errors {
    const errors: Errors = {};
    if (step === 0) {
        if (values.name.trim().length < 2) errors.name = "Enter the owner's full name";
        if (!validPhone(values.phone)) errors.phone = "Enter a valid 10-digit mobile number";
        if (!values.whatsappSame && values.whatsapp && !validPhone(values.whatsapp))
            errors.whatsapp = "Enter a valid 10-digit WhatsApp number";
        if (values.altPhone && !validPhone(values.altPhone))
            errors.altPhone = "Enter a valid alternate number";
        if (!validEmail(values.email)) errors.email = "Enter a valid email address";
        if (!values.ownerType) errors.ownerType = "Choose an owner type";
        if (values.idProof && values.idProof.size > 5 * 1024 * 1024)
            errors.idProof = "File must be under 5 MB";
        if (
            values.idProof &&
            !["image/jpeg", "image/png", "application/pdf"].includes(values.idProof.type)
        )
            errors.idProof = "Use a JPG, PNG or PDF file";
    }
    if (step === 1) {
        if (!values.propertyType) errors.propertyType = "Choose a property type";
        if (showOwnerBhk(values) && !values.configuration)
            errors.configuration = "Choose a configuration";
        if (!values.societyName.trim()) errors.societyName = "Enter the project or building name";
        if (!values.locality.trim()) errors.locality = "Choose or enter a locality";
        if (values.pincode && !/^\d{6}$/.test(values.pincode))
            errors.pincode = "Enter a 6-digit pincode";
        if (!values.carpetArea || Number(values.carpetArea) <= 0)
            errors.carpetArea = "Enter the carpet area";
        if (values.photos.length > 10) errors.photos = "Add no more than 10 photos";
    }
    if (step === 2) {
        if (values.intent === "sell" && !values.expectedPrice)
            errors.expectedPrice = "Enter the expected price";
        if (values.intent !== "sell" && !values.expectedRent)
            errors.expectedRent = "Enter the monthly rent";
    }
    if (step === 3 && values.exclusive && !values.agreementValidTill)
        errors.agreementValidTill = "Choose when the agreement ends";
    if (step === 4 && !values.source) errors.source = "Choose how you found this owner";
    return errors;
}

export function serializableOwnerDraft(values: OwnerContactForm) {
    return { ...values, idProof: null, photos: [], documents: [] };
}
