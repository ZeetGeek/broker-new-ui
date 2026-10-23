import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";

import { formatDateIso } from "@/lib/format/date";
import { calculateListingScore } from "@/lib/hooks/use-listing-score";
import {
    loadPropertyDraft,
    propertyDraftKey,
    removePropertyDraft,
    savePropertyDraft,
} from "@/lib/properties/form-draft-storage";
import { MAX_DEPOSIT_MONTHS } from "@/lib/properties/form-limits";
import { MAX_PROPERTY_PHOTOS } from "@/lib/properties/form-media";
import {
    propertyDraftValidationIssues,
    quickAddValidationIssues,
} from "@/lib/properties/form-validation";
import { DEFAULT_PROPERTY_DRAFT, fieldRuleSchemas, stepSchemas } from "@/lib/schemas/property";
import { isVisible, missingRequiredFields, stripHidden } from "@/lib/visibility/rules";

function listing() {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    Object.assign(values.basics, {
        title: "2 BHK Apartment in Vesu",
        description:
            "A bright apartment near the main road with a spacious living room and balcony.",
    });
    Object.assign(values.location, {
        locality: "Vesu",
        pincode: "395007",
        projectOrSociety: "Society",
        landmark: "Mall",
    });
    Object.assign(values.details, {
        bedrooms: "2",
        bathrooms: 2,
        floorNumber: 0,
        totalFloors: 5,
        propertyAge: 0,
        propertyCondition: "ready_to_move",
    });
    Object.assign(values.area, { plotArea: 1500, carpetArea: 1200, areaSqft: 1500 });
    values.sale.expectedPrice = 8000000;
    values.furnishing.status = "unfurnished";
    values.media.photos = Array.from({ length: 4 }, (_, i) => ({
        id: String(i),
        url: `https://example.test/photo-${i}.jpg`,
        name: `photo-${i}.jpg`,
        tag: i === 0 ? "cover" : "other",
        isCover: i === 0,
        order: i,
        alt: "Property",
        status: "ready",
    }));
    return values;
}

test("a ground-floor new property passes every publish step", () => {
    const values = listing();
    for (const step of Object.keys(stepSchemas) as (keyof typeof stepSchemas)[]) {
        const parsed = stepSchemas[step].safeParse(values);
        const errors = parsed.success
            ? []
            : parsed.error.issues.filter((issue) => isVisible(issue.path.join("."), values));
        assert.deepEqual(errors, [], step);
        assert.equal(fieldRuleSchemas[step].safeParse(values).success, true, step);
    }
});

test("plots require total area without requiring or submitting carpet area", () => {
    const values = listing();
    values.basics.category = "land";
    values.basics.propertyType = "residential_plot";
    values.area.carpetArea = null;
    assert.deepEqual(missingRequiredFields(values, "details"), []);
    assert.equal(isVisible("area.carpetArea", values), false);
    assert.equal(stripHidden(values).area.carpetArea, undefined);
    values.area.plotArea = null;
    assert.ok(
        missingRequiredFields(values, "details").some((field) => field.path === "area.plotArea"),
    );
});

test("zero deposit and brokerage are real answers, blanks are missing", () => {
    const values = listing();
    values.basics.listingFor = "rent";
    Object.assign(values.rent, {
        monthlyRent: 25000,
        securityDeposit: 0,
        availableFrom: "2099-01-01",
    });
    values.commission.rent.value = 0;
    assert.equal(fieldRuleSchemas.pricing.safeParse(values).success, true);
    assert.equal(stepSchemas.pricing.safeParse(values).success, true);
    values.rent.securityDeposit = null;
    assert.ok(
        missingRequiredFields(values, "pricing").some(
            (field) => field.path === "rent.securityDeposit",
        ),
    );
});

test("photos being compressed cannot satisfy publish requirements", () => {
    const values = listing();
    values.media.photos.forEach((photo) => {
        photo.status = "processing";
    });
    assert.equal(stepSchemas.media.safeParse(values).success, false);
    assert.equal(fieldRuleSchemas.media.safeParse(values).success, false);
    values.media.photos.forEach((photo) => {
        photo.status = "queued";
    });
    assert.equal(stepSchemas.media.safeParse(values).success, true);
    while (values.media.photos.length <= MAX_PROPERTY_PHOTOS)
        values.media.photos.push({
            ...values.media.photos[1]!,
            id: `extra-${values.media.photos.length}`,
        });
    assert.equal(stepSchemas.media.safeParse(values).success, false);
});

test("carpet area cannot exceed total area", () => {
    const values = listing();
    values.area.carpetArea = 1600;
    const parsed = stepSchemas.details.safeParse(values);
    assert.equal(parsed.success, false);
    if (!parsed.success)
        assert.ok(parsed.error.issues.some((issue) => issue.path.join(".") === "area.carpetArea"));
});

test("score reaches 100 with available controls and tips point to their fields", () => {
    const values = listing();
    const initial = calculateListingScore(structuredClone(DEFAULT_PROPERTY_DRAFT));
    assert.equal(initial.tips.find((tip) => tip.label.includes("title"))?.step, "details");
    assert.equal(initial.tips.find((tip) => tip.label.includes("description"))?.step, "details");
    values.basics.description = "A spacious apartment. ".repeat(10);
    values.media.photos.push(...[4, 5].map((i) => ({ ...values.media.photos[1]!, id: String(i) })));
    values.amenities.society = ["lift", "power_backup", "cctv", "gym", "security_guard"];
    values.media.videoUrl = "https://youtube.com/watch?v=example";
    assert.equal(calculateListingScore(values).score, 100);
    values.basics.category = "land";
    values.basics.propertyType = "residential_plot";
    values.furnishing.status = "";
    values.amenities.society = [];
    assert.equal(calculateListingScore(values).score, 100);
    assert.ok(!calculateListingScore(values).tips.some((tip) => tip.label.includes("floor plan")));
});

test("drafts are isolated by account, portal, property and kind", () => {
    const keys = [
        propertyDraftKey("a", "owner"),
        propertyDraftKey("b", "owner"),
        propertyDraftKey("a", "broker"),
        propertyDraftKey("a", "owner", "p1"),
        propertyDraftKey("a", "owner", "p1", "extra"),
    ];
    assert.equal(new Set(keys).size, keys.length);
});

/** A small transactional store exercises the browser persistence contract without a browser. */
function installStorage(t: TestContext) {
    const records = new Map<IDBValidKey, unknown>();
    const strings = new Map<string, string>();
    const database = {
        close() {},
        transaction() {
            const transaction = {
                oncomplete: null as (() => void) | null,
                objectStore: () => ({
                    put(record: unknown, key: IDBValidKey) {
                        records.set(key, structuredClone(record));
                        queueMicrotask(() => transaction.oncomplete?.());
                        return { result: key };
                    },
                    get(key: IDBValidKey) {
                        queueMicrotask(() => transaction.oncomplete?.());
                        return { result: structuredClone(records.get(key)) };
                    },
                    delete(key: IDBValidKey) {
                        records.delete(key);
                        queueMicrotask(() => transaction.oncomplete?.());
                        return { result: undefined };
                    },
                }),
            };
            return transaction;
        },
    };
    const oldIndexedDB = Object.getOwnPropertyDescriptor(globalThis, "indexedDB");
    const oldLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "indexedDB", {
        configurable: true,
        value: {
            open() {
                const request = { result: database, onsuccess: null as (() => void) | null };
                queueMicrotask(() => request.onsuccess?.());
                return request;
            },
        },
    });
    Object.defineProperty(globalThis, "localStorage", {
        configurable: true,
        value: {
            setItem: (key: string, value: string) => strings.set(key, value),
            getItem: (key: string) => strings.get(key) ?? null,
            removeItem: (key: string) => strings.delete(key),
        },
    });
    t.after(() => {
        if (oldIndexedDB) Object.defineProperty(globalThis, "indexedDB", oldIndexedDB);
        else Reflect.deleteProperty(globalThis, "indexedDB");
        if (oldLocalStorage) Object.defineProperty(globalThis, "localStorage", oldLocalStorage);
        else Reflect.deleteProperty(globalThis, "localStorage");
    });
    return { strings };
}

test("reload restores actual photo bytes with a fresh usable preview", async (t) => {
    installStorage(t);
    const values = listing();
    const file = new File(["photo bytes"], "cover.webp", { type: "image/webp" });
    const url = URL.createObjectURL(file);
    values.media.photos = [{ ...values.media.photos[0]!, url, status: "queued" }];
    const key = propertyDraftKey("photo-test", "owner");
    await savePropertyDraft(
        key,
        { values, savedAt: new Date().toISOString() },
        new Map([["0", file]]),
    );
    URL.revokeObjectURL(url);
    const restoredFiles = new Map<string, File>();
    const restored = await loadPropertyDraft(key, restoredFiles);
    const restoredPhoto = restored!.values.media.photos[0]!;
    assert.notEqual(restoredPhoto.url, url);
    assert.equal(await restoredFiles.get(restoredPhoto.id)!.text(), "photo bytes");
    assert.equal(restoredPhoto.isCover, true);
    assert.equal(restoredPhoto.status, "queued");
    URL.revokeObjectURL(restoredPhoto.url);
});

test("clearing a draft waits for queued saves and does not resurrect it", async (t) => {
    installStorage(t);
    const key = propertyDraftKey("clear-test", "broker", "edit-1");
    const save = savePropertyDraft(
        key,
        { values: listing(), savedAt: new Date().toISOString(), ui: { step: "pricing" } },
        new Map(),
    );
    await removePropertyDraft(key);
    await save;
    assert.equal(await loadPropertyDraft(key, new Map()), null);
});

test("text fallback survives blocked photo storage and reports unsaved photos", async (t) => {
    installStorage(t);
    Object.defineProperty(globalThis, "indexedDB", {
        configurable: true,
        value: {
            open() {
                throw new Error("Blocked");
            },
        },
    });
    const key = propertyDraftKey("fallback-test", "owner");
    const values = listing();
    const file = new File(["photo"], "cover.webp");
    const url = URL.createObjectURL(file);
    values.media.photos[0]!.url = url;
    await assert.rejects(
        savePropertyDraft(
            key,
            { values, savedAt: new Date().toISOString() },
            new Map([["0", file]]),
        ),
        /photos could not be saved/,
    );
    const restored = await loadPropertyDraft(key, new Map());
    assert.equal(restored!.values.basics.title, values.basics.title);
    assert.ok(restored!.values.media.photos.every((photo) => !photo.url.startsWith("blob:")));
    URL.revokeObjectURL(url);
});

test("edit recovery retains its step and a pending buyer retry without another create", async (t) => {
    installStorage(t);
    const key = propertyDraftKey("retry-test", "broker", "edit-1");
    const values = listing();
    const pendingAttachment = {
        listing: {
            id: "already-saved-property",
        } as import("@/features/properties/your-listings/types").MyListingItem,
        buyerIds: ["buyer-1"],
        draft: false,
    };
    await savePropertyDraft(
        key,
        { values, savedAt: new Date().toISOString(), ui: { step: "media" }, pendingAttachment },
        new Map(),
    );
    const restored = await loadPropertyDraft(key, new Map());
    assert.equal(restored!.ui?.step, "media");
    assert.equal(restored!.pendingAttachment?.listing.id, "already-saved-property");
    assert.deepEqual(restored!.pendingAttachment?.buyerIds, ["buyer-1"]);
});

test("start fresh clears text drafts even when IndexedDB is blocked", async (t) => {
    installStorage(t);
    const key = propertyDraftKey("blocked-clear", "owner");
    await savePropertyDraft(
        key,
        { values: listing(), savedAt: new Date().toISOString() },
        new Map(),
    );
    const workingStore = globalThis.indexedDB;
    Object.defineProperty(globalThis, "indexedDB", {
        configurable: true,
        value: {
            open() {
                throw new Error("Blocked");
            },
        },
    });
    await removePropertyDraft(key);
    assert.equal(await loadPropertyDraft(key, new Map()), null);
    Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: workingStore });
    assert.equal(await loadPropertyDraft(key, new Map()), null);
});

test("number validation enforces the limits shown by the form", () => {
    for (const [field, invalid] of [
        ["propertyAge", 101],
        ["propertyAge", 0.5],
        ["floorNumber", 201],
        ["floorNumber", 1.5],
        ["totalFloors", 201],
        ["totalFloors", 3.5],
        ["bathrooms", 1.5],
        ["bathrooms", 11],
        ["balconies", 6],
        ["coveredParking", 11],
    ] as const) {
        const values = listing();
        values.details[field] = invalid;
        const parsed = stepSchemas.details.safeParse(values);
        assert.equal(parsed.success, false, `${field}: ${invalid}`);
        if (!parsed.success)
            assert.ok(
                parsed.error.issues.some((issue) => issue.path.join(".") === `details.${field}`),
            );
    }
    const values = listing();
    values.details.propertyAge = 100;
    values.details.floorNumber = 200;
    values.details.totalFloors = 200;
    assert.equal(stepSchemas.details.safeParse(values).success, true);
    values.details.bedrooms = "1rk";
    assert.equal(stepSchemas.details.safeParse(values).success, true);
    values.details.bedrooms = "10_plus";
    assert.equal(stepSchemas.details.safeParse(values).success, true);
});

test("whitespace cannot satisfy required society and location fields", () => {
    const values = listing();
    values.location.projectOrSociety = " \t ";
    assert.ok(
        missingRequiredFields(values, "basics").some(
            (field) => field.path === "location.projectOrSociety",
        ),
    );
    assert.equal(fieldRuleSchemas.basics.safeParse(values).success, false);
    values.location.city = "   ";
    assert.equal(stepSchemas.basics.safeParse(values).success, false);
    assert.ok(
        quickAddValidationIssues(values, "broker").some(
            (issue) => issue.path === "location.projectOrSociety",
        ),
    );
});

test("media links must be real web URLs and videos must use a supported provider", () => {
    for (const invalid of [
        "not a url",
        "javascript:alert(1)",
        "ftp://example.com/video",
        "https://example.com/video",
        "https://youtube.com/",
        "https://youtube.com.evil.test/watch?v=abc",
    ]) {
        const values = listing();
        values.media.videoUrl = invalid;
        assert.equal(stepSchemas.media.safeParse(values).success, false, invalid);
    }
    for (const valid of [
        "",
        "https://youtu.be/dQw4w9WgXc",
        "https://www.youtube.com/watch?v=dQw4w9WgXc",
        "https://vimeo.com/123456789",
    ]) {
        const values = listing();
        values.media.videoUrl = valid;
        assert.equal(stepSchemas.media.safeParse(values).success, true, valid);
    }
    for (const invalid of ["not a url", "javascript:alert(1)", "data:text/html,test", "https://"]) {
        const values = listing();
        values.media.virtualTourUrl = invalid;
        assert.equal(stepSchemas.media.safeParse(values).success, false, invalid);
    }
    const values = listing();
    values.media.virtualTourUrl = "https://my.matterport.com/show/?m=example";
    assert.equal(stepSchemas.media.safeParse(values).success, true);
});

test("rent availability requires a real calendar date and accepts today", () => {
    const values = listing();
    values.basics.listingFor = "rent";
    Object.assign(values.rent, { monthlyRent: 25000, securityDeposit: 0 });
    values.commission.rent.value = 0;
    for (const invalid of [
        "2099-99-99",
        "2099-02-29",
        "2100-02-29",
        "2099-04-31",
        "2099-2-1",
        "tomorrow",
        "2020-01-01",
    ]) {
        values.rent.availableFrom = invalid;
        assert.equal(stepSchemas.pricing.safeParse(values).success, false, invalid);
    }
    for (const valid of [formatDateIso(new Date()), "2096-02-29", "2099-12-31"]) {
        values.rent.availableFrom = valid;
        assert.equal(stepSchemas.pricing.safeParse(values).success, true, valid);
    }
});

test("deposit months use the same whole-number limit as the counter", () => {
    const values = listing();
    values.basics.listingFor = "rent";
    Object.assign(values.rent, {
        monthlyRent: 25000,
        availableFrom: "2099-01-01",
        securityDepositMode: "months_of_rent",
    });
    values.commission.rent.value = 0;
    for (const valid of [0, MAX_DEPOSIT_MONTHS]) {
        values.rent.securityDeposit = valid;
        assert.equal(stepSchemas.pricing.safeParse(values).success, true);
    }
    for (const invalid of [-1, 0.5, MAX_DEPOSIT_MONTHS + 1]) {
        values.rent.securityDeposit = invalid;
        assert.equal(stepSchemas.pricing.safeParse(values).success, false);
    }
    values.rent.securityDepositMode = "amount";
    values.rent.securityDeposit = 50000;
    assert.equal(stepSchemas.pricing.safeParse(values).success, true);
});

test("Quick add rejects invalid area, price and title using the full form rules", () => {
    for (const invalid of [-100, 0, Number.NaN, Number.POSITIVE_INFINITY]) {
        const values = listing();
        values.area.plotArea = invalid;
        // Stale derived area must not allow an invalid visible input through.
        assert.ok(
            quickAddValidationIssues(values, "broker").some(
                (issue) => issue.path === "area.plotArea",
            ),
        );
    }
    for (const invalid of [-1, 0, 100_000_000_001, Number.POSITIVE_INFINITY]) {
        const values = listing();
        values.sale.expectedPrice = invalid;
        assert.ok(
            quickAddValidationIssues(values, "broker").some(
                (issue) => issue.path === "sale.expectedPrice",
            ),
        );
    }
    for (const invalid of [" ", "x".repeat(121)]) {
        const values = listing();
        values.basics.title = invalid;
        assert.ok(
            quickAddValidationIssues(values, "broker").some(
                (issue) => issue.path === "basics.title",
            ),
        );
    }
    const values = listing();
    values.basics.title = "x".repeat(120);
    values.sale.expectedPrice = 100_000_000_000;
    values.basics.description = "";
    values.media.photos = values.media.photos.slice(0, 1);
    assert.deepEqual(quickAddValidationIssues(values, "broker"), []);
});

test("Quick add validates its visible choices without demanding unrelated full-form fields", () => {
    const values = listing();
    values.basics.listingFor = "rent";
    values.basics.description = "";
    values.rent.monthlyRent = 25000;
    values.commission.rent.value = 0;
    values.sale.expectedPrice = -5;
    values.commission.sale.value = 99;
    values.details.propertyAge = 999;
    values.media.photos = values.media.photos.slice(0, 1);
    assert.deepEqual(quickAddValidationIssues(values, "owner"), []);
    values.location.pincode = "123";
    assert.ok(
        quickAddValidationIssues(values, "owner").some(
            (issue) => issue.path === "location.pincode",
        ),
    );
    values.basics.category = "land";
    assert.ok(
        quickAddValidationIssues(values, "owner").some(
            (issue) => issue.path === "basics.propertyType",
        ),
    );
});

test("Full details drafts allow incomplete data but reject malformed values", () => {
    const values = structuredClone(DEFAULT_PROPERTY_DRAFT);
    values.basics.description = "Work in progress";
    assert.deepEqual(propertyDraftValidationIssues(values), []);
    values.details.propertyAge = 101;
    values.media.videoUrl = "not a link";
    const issues = propertyDraftValidationIssues(values);
    assert.ok(
        issues.some((issue) => issue.path === "details.propertyAge" && issue.step === "details"),
    );
    assert.ok(issues.some((issue) => issue.path === "media.videoUrl" && issue.step === "media"));
    values.basics.category = "land";
    values.basics.propertyType = "residential_plot";
    assert.ok(
        !propertyDraftValidationIssues(values).some(
            (issue) => issue.path === "details.propertyAge",
        ),
    );
});
