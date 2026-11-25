"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
    beginTestLabReload,
    DEFAULT_TEST_LAB,
    getTestLabSettings,
    saveTestLabSettings,
    TEST_LAB_AVAILABLE,
    TEST_LAB_OPEN_KEY,
    type TestLabSettings,
} from "@/lib/testing/test-lab";

import { RotateCcw, SlidersHorizontal, XIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

import { FEATURE_PLATFORM_OWNER } from "@/config";

import styles from "./test-lab.module.css";

const VOLUMES = [
    { value: "less", label: "Less data", detail: "Up to 3 records per list" },
    { value: "more", label: "More data", detail: "30+ records per dataset" },
    { value: "stress", label: "Too much data", detail: "300 records per dataset" },
    { value: "empty", label: "Empty all", detail: "No sample records anywhere" },
] as const;

const NETWORKS = [
    ["online", "Online · instant sample data"],
    ["slow", "Slow connection · 2.5s per request"],
    ["offline", "Offline · network requests fail"],
    ["loading", "Loading · keep requests pending"],
    ["error", "Server error · 500"],
    ["unauthorized", "Unauthorized response · 401"],
    ["forbidden", "Access denied · 403"],
    ["rate-limited", "Rate limited · 429"],
] as const;

export function TestLab() {
    const mounted = useSyncExternalStore(
        subscribeToMount,
        () => true,
        () => false,
    );
    return TEST_LAB_AVAILABLE && mounted ? <TestLabControls /> : null;
}

function subscribeToMount() {
    return () => {};
}

function TestLabControls() {
    const [open, setOpen] = useState(() => {
        try {
            return sessionStorage.getItem(TEST_LAB_OPEN_KEY) === "true";
        } catch {
            return false;
        }
    });
    const [active] = useState(getTestLabSettings);
    const [draft, setDraft] = useState<TestLabSettings>(() => {
        const settings = getTestLabSettings();
        return settings.source === "default" ? { ...settings, source: "sample" } : settings;
    });
    const [error, setError] = useState("");
    const trigger = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLFormElement>(null);

    const close = useCallback(() => {
        setOpen(false);
        try {
            sessionStorage.removeItem(TEST_LAB_OPEN_KEY);
        } catch {
            /* Closing works without storage. */
        }
        requestAnimationFrame(() => trigger.current?.focus());
    }, []);

    useEffect(() => {
        if (!open) return;
        panel.current?.focus();
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !event.defaultPrevented) {
                close();
            }
        };
        window.addEventListener("keydown", onEscape);
        return () => window.removeEventListener("keydown", onEscape);
    }, [open, close]);

    function update<K extends keyof TestLabSettings>(key: K, value: TestLabSettings[K]) {
        setDraft((current) => ({ ...current, [key]: value }));
    }

    function apply(settings = draft) {
        try {
            saveTestLabSettings(settings);
            beginTestLabReload();
            const portalChanged =
                settings.source === "sample" &&
                (settings.portal !== active.portal ||
                    !/^\/(broker|owner)(\/|$)/.test(location.pathname));
            if (portalChanged)
                location.assign(settings.portal === "owner" ? "/owner" : "/broker/dashboard");
            else location.reload();
        } catch {
            setError("Allow browser storage for this site to save your test settings.");
        }
    }

    const sample = active.source === "sample";
    const activeVolume = VOLUMES.find((item) => item.value === active.volume)?.label;

    return (
        <div className={styles.root} data-test-lab>
            {!open && (
                <button
                    ref={trigger}
                    type="button"
                    className={styles.launcher}
                    onClick={() => setOpen(true)}
                    aria-expanded={open}
                    aria-controls="test-lab-panel"
                    data-active={sample}
                >
                    <SlidersHorizontal size={18} aria-hidden />
                    <span>Test lab</span>
                    {sample && (
                        <span className={styles.launcherState}>
                            {[
                                activeVolume,
                                active.account === "new" ? "New account" : null,
                                active.network === "online" ? null : active.network,
                            ]
                                .filter(Boolean)
                                .join(" · ")}
                        </span>
                    )}
                </button>
            )}
            {open && (
                <form
                    ref={panel}
                    tabIndex={-1}
                    id="test-lab-panel"
                    className={styles.panel}
                    aria-labelledby="test-lab-title"
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply();
                    }}
                    onKeyDown={(event) => {
                        if (
                            event.key !== "Enter" ||
                            event.defaultPrevented ||
                            event.nativeEvent.isComposing
                        )
                            return;
                        if (
                            event.target instanceof Element &&
                            event.target.closest("button, select, textarea, [role='combobox']")
                        )
                            return;
                        event.preventDefault();
                        event.currentTarget.requestSubmit();
                    }}
                >
                    <header className={styles.header}>
                        <div>
                            <h2 id="test-lab-title">Test lab</h2>
                            <p>One setup. Every page.</p>
                        </div>
                        <button
                            ref={trigger}
                            className={styles.close}
                            type="button"
                            onClick={close}
                            aria-label="Close test lab"
                        >
                            <XIcon size={20} aria-hidden />
                        </button>
                    </header>
                    <div className={styles.activeState} role="status">
                        <span className={styles.statusDot} data-active={sample} />
                        {sample
                            ? [
                                  "Sample data",
                                  activeVolume,
                                  active.account === "new" ? "New account" : null,
                                  active.network,
                              ]
                                  .filter(Boolean)
                                  .join(" · ")
                            : active.source === "live"
                              ? "Using live API data"
                              : "Using project defaults"}
                    </div>
                    <div className={styles.body}>
                        <p className={styles.intro}>
                            Switch app states without editing code. Sample data stays in this tab
                            and works without the backend.
                        </p>
                        <fieldset className={styles.fieldset}>
                            <legend>Data source</legend>
                            <div className={styles.sourceChoices}>
                                {(
                                    [
                                        ["sample", "Sample data"],
                                        ["live", "Live API"],
                                    ] as const
                                ).map(([value, label]) => (
                                    <label key={value} className={styles.sourceChoice}>
                                        <input
                                            type="radio"
                                            name="test-source"
                                            value={value}
                                            checked={draft.source === value}
                                            onChange={() => update("source", value)}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        {draft.source === "sample" ? (
                            <>
                                <fieldset className={styles.fieldset}>
                                    <legend>How much data?</legend>
                                    <div className={styles.volumes}>
                                        {VOLUMES.map((volume) => (
                                            <label key={volume.value} className={styles.volume}>
                                                <input
                                                    type="radio"
                                                    name="test-volume"
                                                    value={volume.value}
                                                    checked={draft.volume === volume.value}
                                                    onChange={() => update("volume", volume.value)}
                                                />
                                                <span>
                                                    <strong>{volume.label}</strong>
                                                    <small>{volume.detail}</small>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    <p className={styles.hint}>
                                        Empty all clears sample data only. Your real records stay
                                        safe.
                                    </p>
                                </fieldset>
                                <fieldset className={styles.fieldset}>
                                    <legend>Account</legend>
                                    <label className={styles.field}>
                                        <span>Account state</span>
                                        <select
                                            value={draft.account}
                                            onChange={(event) =>
                                                update(
                                                    "account",
                                                    event.target
                                                        .value as TestLabSettings["account"],
                                                )
                                            }
                                        >
                                            <option value="existing">Existing account</option>
                                            <option value="new">
                                                New account · first-day profile
                                            </option>
                                            <option value="incomplete">Incomplete profile</option>
                                            <option value="unverified">Email not verified</option>
                                            <option value="signed-out">
                                                Signed out · login screen
                                            </option>
                                        </select>
                                    </label>
                                    {draft.account === "new" && (
                                        <p className={styles.hint}>
                                            Uses a first-day profile with the data volume selected
                                            above. Choose Empty all to test a new account without
                                            any records.
                                        </p>
                                    )}
                                    <label className={styles.field}>
                                        <span>Account type</span>
                                        <select
                                            value={draft.accountType}
                                            onChange={(event) =>
                                                update(
                                                    "accountType",
                                                    event.target
                                                        .value as TestLabSettings["accountType"],
                                                )
                                            }
                                        >
                                            <option value="individual">Individual</option>
                                            <option value="organization">Organization</option>
                                        </select>
                                    </label>
                                    {FEATURE_PLATFORM_OWNER && (
                                        <label className={styles.field}>
                                            <span>Portal</span>
                                            <select
                                                value={draft.portal}
                                                onChange={(event) =>
                                                    update(
                                                        "portal",
                                                        event.target
                                                            .value as TestLabSettings["portal"],
                                                    )
                                                }
                                            >
                                                <option value="broker">Broker</option>
                                                <option value="owner">Owner</option>
                                            </select>
                                        </label>
                                    )}
                                </fieldset>
                                <fieldset className={styles.fieldset}>
                                    <legend>Connection & responses</legend>
                                    <label className={styles.field}>
                                        <span>Network condition</span>
                                        <select
                                            value={draft.network}
                                            onChange={(event) =>
                                                update(
                                                    "network",
                                                    event.target
                                                        .value as TestLabSettings["network"],
                                                )
                                            }
                                        >
                                            {NETWORKS.map(([value, label]) => (
                                                <option key={value} value={value}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <p className={styles.hint}>
                                        Offline makes sample reads and saves fail. Loading stays
                                        pending until you apply another condition.
                                    </p>
                                </fieldset>
                                <label className={styles.edgeCases}>
                                    <input
                                        type="checkbox"
                                        checked={draft.edgeCases}
                                        onChange={(event) =>
                                            update("edgeCases", event.target.checked)
                                        }
                                    />
                                    <span>
                                        <strong>Test awkward content</strong>
                                        <small>
                                            Long names and missing images on some records.
                                        </small>
                                    </span>
                                </label>
                            </>
                        ) : (
                            <p className={styles.liveNote}>
                                Use your existing login and the configured backend. Sample settings
                                and simulated connection states are turned off.
                            </p>
                        )}
                        {error && (
                            <p className={styles.error} role="alert">
                                {error}
                            </p>
                        )}
                    </div>
                    <footer className={styles.footer}>
                        <Button type="submit" className="inline-full">
                            Apply & reload
                        </Button>
                        <div className={styles.footerActions}>
                            <button
                                type="button"
                                onClick={() => apply({ ...DEFAULT_TEST_LAB, source: "sample" })}
                            >
                                <RotateCcw size={15} aria-hidden /> Reset samples
                            </button>
                            <button type="button" onClick={() => apply(DEFAULT_TEST_LAB)}>
                                Project defaults
                            </button>
                        </div>
                        <p>Applying reseeds samples and reloads this page.</p>
                    </footer>
                </form>
            )}
        </div>
    );
}
