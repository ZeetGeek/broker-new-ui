import { FEATURE_PLATFORM_OWNER, USE_MOCK_DATA } from "@/config";

/** Explicitly opt in on a deployed preview; the lab is absent from normal production builds. */
export const TEST_LAB_AVAILABLE =
    process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_TEST_LAB === "true";
export const TEST_LAB_KEY = "crm.test-lab.v1";
export const TEST_LAB_OPEN_KEY = "crm.test-lab.open";

let reloading = false;

export function beginTestLabReload(): void {
    reloading = true;
}
export function isTestLabReloading(): boolean {
    return TEST_LAB_AVAILABLE && reloading;
}

export type TestLabSettings = {
    source: "default" | "sample" | "live";
    volume: "less" | "more" | "stress" | "empty";
    account: "existing" | "new" | "incomplete" | "unverified" | "signed-out";
    accountType: "individual" | "organization";
    portal: "broker" | "owner";
    network:
        | "online"
        | "slow"
        | "offline"
        | "error"
        | "unauthorized"
        | "forbidden"
        | "rate-limited"
        | "loading";
    edgeCases: boolean;
    revision: number;
};

export const DEFAULT_TEST_LAB: TestLabSettings = {
    source: "default",
    volume: "more",
    account: "existing",
    accountType: "individual",
    portal: "broker",
    network: "online",
    edgeCases: false,
    revision: 0,
};

export function parseTestLabSettings(raw: unknown): TestLabSettings {
    const settings = { ...DEFAULT_TEST_LAB };
    if (!raw || typeof raw !== "object") return settings;
    const value = raw as Record<string, unknown>;
    const choices = {
        source: ["default", "sample", "live"],
        volume: ["less", "more", "stress", "empty"],
        account: ["existing", "new", "incomplete", "unverified", "signed-out"],
        accountType: ["individual", "organization"],
        portal: FEATURE_PLATFORM_OWNER ? ["broker", "owner"] : ["broker"],
        network: [
            "online",
            "slow",
            "offline",
            "error",
            "unauthorized",
            "forbidden",
            "rate-limited",
            "loading",
        ],
    };
    for (const key of Object.keys(choices) as Array<keyof typeof choices>) {
        if (typeof value[key] === "string" && choices[key].includes(value[key] as string)) {
            Object.assign(settings, { [key]: value[key] });
        }
    }
    settings.edgeCases = value.edgeCases === true;
    if (
        typeof value.revision === "number" &&
        Number.isSafeInteger(value.revision) &&
        value.revision >= 0
    )
        settings.revision = value.revision;
    return settings;
}

export function getTestLabSettings(): TestLabSettings {
    if (!TEST_LAB_AVAILABLE || typeof window === "undefined") return DEFAULT_TEST_LAB;
    try {
        return parseTestLabSettings(
            JSON.parse(window.sessionStorage.getItem(TEST_LAB_KEY) ?? "null"),
        );
    } catch {
        return DEFAULT_TEST_LAB;
    }
}

export function isTestSampleMode(): boolean {
    return TEST_LAB_AVAILABLE && getTestLabSettings().source === "sample";
}

export function isSampleDataEnabled(): boolean {
    const source = getTestLabSettings().source;
    return source === "sample" || (source === "default" && USE_MOCK_DATA);
}

/** Only this tab's test namespace is ever removed. Real sessions and saved work are untouched. */
export function saveTestLabSettings(settings: TestLabSettings): void {
    if (!TEST_LAB_AVAILABLE || typeof window === "undefined") return;
    const next = parseTestLabSettings({ ...settings, revision: Date.now() });
    for (const storage of [window.sessionStorage, window.localStorage]) {
        for (const key of Object.keys(storage)) {
            if (key.startsWith("crm.test-lab.data.")) storage.removeItem(key);
        }
    }
    window.sessionStorage.setItem(TEST_LAB_KEY, JSON.stringify(next));
    window.sessionStorage.setItem(TEST_LAB_OPEN_KEY, "true");
}

export function testStorageKey(key: string): string {
    return isTestSampleMode() ? `crm.test-lab.data.${key}` : key;
}

export function hasEmptyTestWorkspace(): boolean {
    const settings = getTestLabSettings();
    return isTestSampleMode() && settings.volume === "empty";
}
