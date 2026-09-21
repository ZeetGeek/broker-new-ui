"use client";

import {
    type FormEvent,
    type MutableRefObject,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { type FieldPath, FormProvider, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import { ChevronDown, RotateCcw, X } from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import { useListingScore } from "@/lib/hooks/use-listing-score";
import { BROKER_YOUR_LISTINGS_HREF, brokerPropertyDetailHref } from "@/lib/routes/broker";
import {
    DEFAULT_PROPERTY_DRAFT,
    fieldRuleSchemas,
    type PropertyDraftValues,
    STEP_ROOT_FIELDS,
    stepSchemas,
} from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import { isStepVisible as ruleStepIsVisible, labelOf, stripHidden } from "@/lib/visibility/rules";
import { FieldRulesProvider } from "@/lib/visibility/use-field-rules";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { FORM_STEPS, type PropertyFormStep, toLabel } from "@/constants/property";
import { SlidingTabs } from "@/features/design-system/theme/sliding-tabs";
import { ListingScoreRing } from "@/features/properties/property-form/listing-score-ring";
import { LiveSummaryPanel } from "@/features/properties/property-form/live-summary-panel";
import { QuickAdd } from "@/features/properties/property-form/quick-add";
import { StepNav } from "@/features/properties/property-form/step-nav";
import { StepArea } from "@/features/properties/property-form/steps/step-area";
import { StepBasics } from "@/features/properties/property-form/steps/step-basics";
import { StepCommission } from "@/features/properties/property-form/steps/step-commission";
import { StepDetails } from "@/features/properties/property-form/steps/step-details";
import { StepFurnishing } from "@/features/properties/property-form/steps/step-furnishing";
import { StepLocation } from "@/features/properties/property-form/steps/step-location";
import { StepMedia } from "@/features/properties/property-form/steps/step-media";
import { StepPricing } from "@/features/properties/property-form/steps/step-pricing";
import { StepPublish } from "@/features/properties/property-form/steps/step-publish";
import type {
    CreateMyListingInput,
    MyListingItem,
    MyListingPropertyType,
} from "@/features/properties/your-listings/types";

// v2: nearbyPlaces changed from {id,type,name,distanceKm}[] to a plain string[] of place types.
// v3: area units went international; bigha/guntha/kanal/marla/cent/ground no longer exist.
// v4: commission is owner-paid only; paidBy/mode are now fixed literals.
// v5: construction stage/progress/slabs and the RERA + handover dates were removed.
// v6: the availability block (visit days, times, key holder, caretaker) was removed.
const LOCAL_DRAFT_VERSION = 9;

/** Map old 10-step draft UI ids onto the merged 5-step wizard. */
const LEGACY_STEP_MAP: Record<string, PropertyFormStep> = {
    basics: "basics",
    location: "basics",
    details: "details",
    area: "details",
    pricing: "pricing",
    commission: "pricing",
    furnishing: "furnishing",
    highlights: "furnishing",
    media: "media",
    publish: "media",
};

function resolveDraftStep(step: string | undefined): PropertyFormStep | null {
    if (!step) return null;
    return (
        LEGACY_STEP_MAP[step] ??
        (FORM_STEPS.some((item) => item.id === step) ? (step as PropertyFormStep) : null)
    );
}

export type PropertyFormProps = {
    mode: "create" | "edit";
    propertyId?: string;
    initialListing?: MyListingItem | null;
    onCancel?: () => void;
    variant?: "dialog" | "page";
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSaved?: (listing: MyListingItem) => void;
};

export function PropertyForm({
    mode,
    propertyId,
    initialListing,
    onCancel,
    variant = "page",
    className,
    open = false,
    onOpenChange,
    onSaved,
}: PropertyFormProps) {
    const router = useRouter();
    const isDialog = variant === "dialog";
    const formIsActive = !isDialog || open;
    const [step, setStep] = useState<PropertyFormStep>("basics");
    const [highestUnlocked, setHighestUnlocked] = useState(
        mode === "edit" ? FORM_STEPS.length - 1 : 0,
    );
    const [completedSteps, setCompletedSteps] = useState<Set<PropertyFormStep>>(new Set());
    const [entryMode, setEntryMode] = useState<"full" | "quick">("full");
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
    const [formBanner, setFormBanner] = useState<ReactNode>(null);
    const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
    const [mobileScoreOpen, setMobileScoreOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingIntent, setSavingIntent] = useState<"draft" | "publish" | null>(null);
    const photoFilesRef = useRef<Map<string, File>>(new Map());
    const autosaveReadyRef = useRef(false);
    const recoveryCheckedRef = useRef(false);
    const persistInFlightRef = useRef(false);
    const localStorageKey = `property-draft:v${LOCAL_DRAFT_VERSION}:${propertyId ?? "new"}`;

    const defaultValues = useMemo(
        () => (initialListing ? listingToDraft(initialListing) : cloneDefaultDraft()),
        [initialListing],
    );
    const methods = useForm<PropertyDraftValues>({
        defaultValues,
        mode: "onTouched",
        shouldUnregister: false,
    });
    const values = useWatch({ control: methods.control }) as PropertyDraftValues;

    const draftUiState = useMemo(
        () => ({
            step,
            highestUnlocked,
            entryMode,
            completedSteps: Array.from(completedSteps),
        }),
        [completedSteps, entryMode, highestUnlocked, step],
    );

    const writeLocalDraft = useCallback(
        (nextValues: PropertyDraftValues, ui = draftUiState) => {
            window.localStorage.setItem(
                localStorageKey,
                JSON.stringify({
                    version: LOCAL_DRAFT_VERSION,
                    savedAt: new Date().toISOString(),
                    values: draftForStorage(nextValues),
                    ui,
                }),
            );
        },
        [draftUiState, localStorageKey],
    );
    const activeSteps = useMemo(
        () => FORM_STEPS.filter((item) => ruleStepIsVisible(item.id, values)),
        [values],
    );
    const stepIndex = activeSteps.findIndex((item) => item.id === step);
    const isLastStep = stepIndex === activeSteps.length - 1;

    const listingScore = useListingScore(values);
    useEffect(() => {
        if (values.publish.listingScore !== listingScore.score) {
            methods.setValue("publish.listingScore", listingScore.score, { shouldDirty: false });
        }
    }, [listingScore.score, methods, values.publish.listingScore]);

    useEffect(() => {
        if (mode !== "edit" || !initialListing || !propertyId) return;
        try {
            const stored = window.localStorage.getItem(
                `property-extra:v${LOCAL_DRAFT_VERSION}:${propertyId}`,
            );
            if (!stored) return;
            const parsed = JSON.parse(stored) as { values?: Partial<PropertyDraftValues> };
            if (parsed.values)
                methods.reset(mergeDraft(listingToDraft(initialListing), parsed.values));
        } catch {
            window.localStorage.removeItem(`property-extra:v${LOCAL_DRAFT_VERSION}:${propertyId}`);
        }
    }, [initialListing, methods, mode, propertyId]);

    useEffect(() => {
        if (!formIsActive || recoveryCheckedRef.current) return;
        recoveryCheckedRef.current = true;
        if (mode !== "create") {
            autosaveReadyRef.current = true;
            return;
        }
        try {
            const legacyKey = `property-draft:v6:${propertyId ?? "new"}`;
            const stored =
                window.localStorage.getItem(localStorageKey) ??
                window.localStorage.getItem(legacyKey);
            if (!stored) {
                autosaveReadyRef.current = true;
                return;
            }
            const parsed = JSON.parse(stored) as {
                values?: Partial<PropertyDraftValues>;
                ui?: {
                    step?: string;
                    highestUnlocked?: number;
                    entryMode?: "full" | "quick";
                    completedSteps?: string[];
                };
                savedAt?: string;
            };
            if (!parsed.values) {
                autosaveReadyRef.current = true;
                return;
            }
            const recovered = mergeDraft(cloneDefaultDraft(), parsed.values);
            methods.reset(recovered);
            const restoredStep = resolveDraftStep(parsed.ui?.step);
            if (restoredStep) setStep(restoredStep);
            if (typeof parsed.ui?.highestUnlocked === "number") {
                // Old drafts unlocked up to 9; clamp to the new 5-step range.
                setHighestUnlocked(
                    Math.min(Math.max(parsed.ui.highestUnlocked, 0), FORM_STEPS.length - 1),
                );
            }
            if (parsed.ui?.entryMode === "full" || parsed.ui?.entryMode === "quick") {
                setEntryMode(parsed.ui.entryMode);
            }
            if (Array.isArray(parsed.ui?.completedSteps)) {
                const mapped = parsed.ui.completedSteps
                    .map((item) => resolveDraftStep(item))
                    .filter((item): item is PropertyFormStep => Boolean(item));
                setCompletedSteps(new Set(mapped));
            }
            setHasRestoredDraft(true);
            setSavedAt(parsed.savedAt ? new Date(parsed.savedAt) : new Date());
            toast.success("Picked up where you left off.");
            window.localStorage.removeItem(legacyKey);
            autosaveReadyRef.current = true;
        } catch {
            window.localStorage.removeItem(localStorageKey);
            autosaveReadyRef.current = true;
        }
    }, [formIsActive, localStorageKey, methods, mode]);

    useEffect(() => {
        if (!formIsActive || !autosaveReadyRef.current || mode !== "create") return;
        const timer = window.setTimeout(() => {
            try {
                writeLocalDraft(values);
                setSavedAt(new Date());
            } catch {
                // A private browser mode may reject storage; the form itself remains usable.
            }
        }, 500);
        return () => window.clearTimeout(timer);
    }, [draftUiState, formIsActive, mode, values, writeLocalDraft]);

    useEffect(() => {
        if (!formIsActive || mode !== "create") return;
        function flushDraft() {
            if (!autosaveReadyRef.current) return;
            try {
                writeLocalDraft(methods.getValues());
            } catch {
                // Ignore storage failures while the tab is closing.
            }
        }
        function onVisibilityChange() {
            if (document.visibilityState === "hidden") flushDraft();
        }
        window.addEventListener("beforeunload", flushDraft);
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => {
            flushDraft();
            window.removeEventListener("beforeunload", flushDraft);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [formIsActive, methods, mode, writeLocalDraft]);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (isDialog && !open) return;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                saveDraftLocally();
                return;
            }
            const target = event.target as HTMLElement | null;
            const isEditing =
                target?.matches("input, textarea, select, [contenteditable='true']") ?? false;
            if (isEditing) return;
            if (!event.ctrlKey && !event.metaKey && !event.altKey && /^[1-9]$/.test(event.key)) {
                const index = Number(event.key) - 1;
                const targetStep = activeSteps[index];
                if (targetStep) changeStep(targetStep.id);
            }
            if (!event.ctrlKey && !event.metaKey && event.key === "0") {
                const targetStep = activeSteps[activeSteps.length - 1];
                if (targetStep) changeStep(targetStep.id);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });

    function saveDraftLocally() {
        try {
            writeLocalDraft(methods.getValues());
            setSavedAt(new Date());
            toast.success("Draft saved on this device.");
        } catch {
            toast.error("Couldn't save the local draft.");
        }
    }

    function startFreshListing() {
        window.localStorage.removeItem(localStorageKey);
        methods.reset(defaultValues);
        setStep("basics");
        setHighestUnlocked(mode === "edit" ? FORM_STEPS.length - 1 : 0);
        setCompletedSteps(new Set());
        setEntryMode("full");
        setHasRestoredDraft(false);
        setSavedAt(null);
        setFormBanner(null);
        toast.success("Started a fresh listing.");
    }

    function validateStep(target: PropertyFormStep): boolean {
        methods.clearErrors(STEP_ROOT_FIELDS[target] as FieldPath<PropertyDraftValues>[]);
        const current = methods.getValues();
        const result = stepSchemas[target].safeParse(current);
        const ruleResult = fieldRuleSchemas[target].safeParse(current);
        if (result.success && ruleResult.success) return true;
        const issues = [
            ...(result.success ? [] : result.error.issues),
            ...(ruleResult.success ? [] : ruleResult.error.issues),
        ];
        const fieldLabels: string[] = [];
        const seenLabels = new Set<string>();
        for (const issue of issues) {
            const path = issue.path.join(".") as FieldPath<PropertyDraftValues>;
            methods.setError(path, { type: "zod", message: issue.message });
            const label = labelOf(path, current);
            if (!seenLabels.has(label)) {
                seenLabels.add(label);
                fieldLabels.push(label);
            }
        }
        const issueCount = fieldLabels.length;
        setFormBanner(
            <div className="flex flex-col gap-1.5">
                <p>
                    {issueCount === 1
                        ? "1 field needs attention before continuing."
                        : `${issueCount} fields need attention before continuing.`}
                </p>
                <ul className="list-disc space-y-0.5 ps-4 font-normal">
                    {fieldLabels.map((label) => (
                        <li key={label}>{label}</li>
                    ))}
                </ul>
            </div>,
        );
        return false;
    }

    function changeStep(next: PropertyFormStep) {
        const nextOriginalIndex = FORM_STEPS.findIndex((item) => item.id === next);
        if (nextOriginalIndex < 0) return;
        if (next === step) return;

        const currentActiveIndex = activeSteps.findIndex((item) => item.id === step);
        const nextActiveIndex = activeSteps.findIndex((item) => item.id === next);
        if (nextActiveIndex < 0) return;

        const goingForward = currentActiveIndex >= 0 && nextActiveIndex > currentActiveIndex;

        // Already-unlocked steps, or the single next step after the current unlock wall.
        if (nextOriginalIndex > highestUnlocked + 1) return;
        if (nextOriginalIndex === highestUnlocked + 1 && !goingForward) return;

        if (goingForward) {
            setFormBanner(null);
            if (!validateStep(step)) {
                document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                return;
            }
            setCompletedSteps((current) => new Set(current).add(step));
            setHighestUnlocked((current) => Math.max(current, nextOriginalIndex));
        }

        setFormBanner(null);
        setMobileSummaryOpen(false);
        setMobileScoreOpen(false);
        setStep(next);
        saveSilent();
    }

    function goBack() {
        if (stepIndex <= 0) return;
        changeStep(activeSteps[stepIndex - 1]!.id);
    }

    function goNext() {
        const next = activeSteps[stepIndex + 1];
        if (!next) return;
        changeStep(next.id);
    }

    function saveSilent() {
        try {
            writeLocalDraft(methods.getValues());
            setSavedAt(new Date());
        } catch {
            // Keep navigating even if storage is unavailable.
        }
    }

    async function persistProperty(intent: "draft" | "publish") {
        if (persistInFlightRef.current) return;
        persistInFlightRef.current = true;
        setFormBanner(null);
        const forceDraft = intent === "draft";
        const publishStatus = forceDraft ? "draft" : "active";
        methods.setValue("publish.status", publishStatus, { shouldDirty: true });
        const current: PropertyDraftValues = {
            ...methods.getValues(),
            publish: { ...methods.getValues().publish, status: publishStatus },
        };
        // Quick add only validates its own fields (draft and publish). Full details
        // still runs the full step schemas on publish — leave that path alone.
        if (entryMode === "quick") {
            const quickProblem = validateQuickDraft(current);
            if (quickProblem) {
                setFormBanner(quickProblem);
                persistInFlightRef.current = false;
                return;
            }
        } else if (!forceDraft) {
            const required = activeSteps.map((item) => item.id);
            for (const requiredStep of required) {
                if (!validateStep(requiredStep)) {
                    const problemIndex = FORM_STEPS.findIndex((item) => item.id === requiredStep);
                    setHighestUnlocked((value) => Math.max(value, problemIndex));
                    setStep(requiredStep);
                    persistInFlightRef.current = false;
                    return;
                }
            }
        }

        // Intent wins over draftToLegacyInput: stripHidden removes publish.status, which
        // would otherwise always serialize as publish: false on edit updates.
        const input = {
            ...draftToLegacyInput(stripHidden(current), photoFilesRef),
            publish: !forceDraft,
        };
        setSaving(true);
        setSavingIntent(intent);
        try {
            if (mode === "edit" && propertyId) {
                const updated = await myListingsApi.update(propertyId, {
                    ...input,
                    status: forceDraft ? "draft" : "published",
                });
                if (!updated) {
                    setFormBanner("Couldn't find that property.");
                    return;
                }
                finishSave(updated, forceDraft);
                return;
            }
            const created = await myListingsApi.create(input);
            finishSave(created, forceDraft);
        } catch (error) {
            setFormBanner(
                error instanceof Error
                    ? error.message
                    : "Couldn't save to the current API. Your complete draft is still saved on this device.",
            );
        } finally {
            persistInFlightRef.current = false;
            setSaving(false);
            setSavingIntent(null);
        }
    }

    function finishSave(listing: MyListingItem, draft: boolean) {
        // Stop autosave so it cannot rewrite the local draft after we clear it.
        autosaveReadyRef.current = false;
        try {
            const stored = draftForStorage(methods.getValues());
            if (listing.imageSrcs.length > 0) {
                stored.media.photos = listing.imageSrcs.map((url, index) => ({
                    id: `existing-${index}`,
                    url,
                    name: `Property photo ${index + 1}`,
                    tag: "other",
                    isCover: index === 0,
                    order: index,
                    alt: listing.title,
                    status: "ready" as const,
                }));
            }
            window.localStorage.setItem(
                `property-extra:v${LOCAL_DRAFT_VERSION}:${listing.id}`,
                JSON.stringify({
                    savedAt: new Date().toISOString(),
                    values: stored,
                }),
            );
        } catch {
            // The existing API save still succeeded; unsupported fields remain best-effort local data.
        }
        window.localStorage.removeItem(localStorageKey);
        if (mode === "create") {
            methods.reset(cloneDefaultDraft());
            setStep("basics");
            setHighestUnlocked(0);
            setCompletedSteps(new Set());
            setEntryMode("full");
            setHasRestoredDraft(false);
            setSavedAt(null);
            setFormBanner(null);
            photoFilesRef.current.clear();
        }
        toast.success(draft ? "Property saved as a draft." : "Property published.");
        onCancel?.();
        onOpenChange?.(false);
        if (onSaved) {
            onSaved(listing);
            return;
        }
        router.push(brokerPropertyDetailHref(listing.id));
    }

    function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (entryMode === "quick") {
            void persistProperty("draft");
            return;
        }
        if (isLastStep) void persistProperty("publish");
        else goNext();
    }

    function handleFormKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
        if (event.key !== "Enter" || event.shiftKey) return;
        const target = event.target as HTMLElement;
        if (
            target.tagName === "TEXTAREA" ||
            target.tagName === "BUTTON" ||
            target.tagName === "SELECT" ||
            target.getAttribute("type") === "file"
        )
            return;
        // Bare Enter must not advance (inputs use it for tags / search / custom add).
        // Ctrl/Cmd+Enter continues or publishes — same as the footer primary action.
        event.preventDefault();
        if (!event.ctrlKey && !event.metaKey) return;
        if (entryMode === "quick") {
            void persistProperty("draft");
            return;
        }
        if (isLastStep) {
            void persistProperty("publish");
            return;
        }
        goNext();
    }

    function requestClose() {
        if (mode === "create" && autosaveReadyRef.current) {
            try {
                writeLocalDraft(methods.getValues());
                setSavedAt(new Date());
            } catch {
                // Still allow closing if storage is unavailable.
            }
        }
        if (
            methods.formState.isDirty &&
            !window.confirm("Close this form? Your latest changes are saved as a local draft.")
        )
            return;
        onOpenChange?.(false);
        onCancel?.();
        if (!isDialog && !onCancel) router.push(BROKER_YOUR_LISTINGS_HREF);
    }

    const surface = (
        <FormProvider {...methods}>
            <FieldRulesProvider>
                <form
                    onSubmit={handleFormSubmit}
                    onKeyDown={handleFormKeyDown}
                    noValidate
                    className={cn(
                        `relative flex flex-1 flex-col overflow-hidden bg-surface min-block-0`,
                        className,
                    )}
                >
                    <PropertyFormHeader
                        mode={mode}
                        entryMode={entryMode}
                        onEntryModeChange={setEntryMode}
                        isSaved={Boolean(savedAt)}
                        savingIntent={savingIntent}
                        onSaveDraft={() => {
                            void persistProperty("draft");
                        }}
                        onPublish={() => {
                            void persistProperty("publish");
                        }}
                        onClose={requestClose}
                        showClose={isDialog}
                    />

                    {entryMode === "full" ? (
                        <>
                            <div
                                className="
                                  shrink-0 border-be border-border-warm bg-surface
                                  xl:hidden
                                "
                            >
                                <StepNav
                                    steps={activeSteps}
                                    activeStep={step}
                                    highestUnlocked={highestUnlocked}
                                    completedSteps={completedSteps}
                                    onStepChange={changeStep}
                                />
                                <MobileListingScore
                                    score={listingScore.score}
                                    tips={listingScore.tips}
                                    open={mobileScoreOpen}
                                    onOpenChange={(next) => {
                                        setMobileScoreOpen(next);
                                        if (next) setMobileSummaryOpen(false);
                                    }}
                                    onTip={(tipStep) => {
                                        setHighestUnlocked(FORM_STEPS.length - 1);
                                        setStep(tipStep);
                                        setMobileScoreOpen(false);
                                    }}
                                />
                            </div>
                            <div
                                className="
                                  grid flex-1 min-block-0
                                  xl:grid-cols-[272px_minmax(0,1fr)_336px]
                                "
                            >
                                <div
                                    className="
                                      hidden flex-col border-e border-border-warm bg-surface px-4
                                      py-5 min-block-0
                                      xl:flex xl:block-full
                                    "
                                >
                                    <StepNav
                                        steps={activeSteps}
                                        activeStep={step}
                                        highestUnlocked={highestUnlocked}
                                        completedSteps={completedSteps}
                                        onStepChange={changeStep}
                                    />
                                </div>
                                <main
                                    className="
                                      overflow-y-auto bg-surface px-5 py-6 min-block-0 min-inline-0
                                      sm:px-6
                                    "
                                >
                                    <div className="-m-1 p-1 pbe-8">
                                        <h1 className="sr-only">{activeSteps[stepIndex]?.label}</h1>
                                        {formBanner ? (
                                            <div
                                                role="alert"
                                                className="
                                                  mbe-5 rounded-control border border-danger/30
                                                  bg-danger-soft px-4 py-3 text-sm font-medium
                                                  text-danger
                                                "
                                            >
                                                {formBanner}
                                            </div>
                                        ) : null}
                                        <StepTransition step={step}>
                                            <StepContent
                                                step={step}
                                                photoFilesRef={photoFilesRef}
                                            />
                                        </StepTransition>
                                    </div>
                                </main>
                                <div
                                    className="
                                      hidden overflow-y-auto border-s border-border-warm
                                      bg-surface-muted/40 p-4 min-block-0 min-inline-0
                                      xl:block
                                    "
                                >
                                    <div className="-m-1 flex flex-col gap-4 p-1">
                                        <LiveSummaryPanel
                                            values={values}
                                            stepIndex={stepIndex}
                                            photoFilesRef={photoFilesRef}
                                            onGoToMedia={() => {
                                                setHighestUnlocked(FORM_STEPS.length - 1);
                                                setStep("media");
                                            }}
                                        />
                                        <Card
                                            className="
                                              gap-0 rounded-card border border-border-warm
                                              bg-surface p-4 shadow-none
                                            "
                                        >
                                            <div className="flex items-center gap-4">
                                                <ListingScoreRing score={listingScore.score} />
                                                <div>
                                                    <p className="text-sm font-bold text-ink">
                                                        Listing score
                                                    </p>
                                                    <p className="mbs-1 text-xs/5 text-ink-muted">
                                                        Complete useful details to improve broker
                                                        confidence.
                                                    </p>
                                                </div>
                                            </div>
                                            {listingScore.tips.length ? (
                                                <div className="mbs-4 space-y-1">
                                                    {listingScore.tips.map((tip) => (
                                                        <Button
                                                            key={tip.label}
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setHighestUnlocked(
                                                                    FORM_STEPS.length - 1,
                                                                );
                                                                setStep(tip.step);
                                                            }}
                                                            className="
                                                              flex items-center justify-between
                                                              gap-3 rounded-control px-2 text-start
                                                              text-xs text-ink-muted inline-full
                                                              min-block-9
                                                              hover:bg-surface hover:text-ink
                                                              focus-visible:ring-3
                                                              focus-visible:ring-ring/30
                                                            "
                                                        >
                                                            <span>{tip.label}</span>
                                                            <span
                                                                className="
                                                              tabular text-brand-text
                                                            "
                                                            >
                                                                +{tip.points}
                                                            </span>
                                                        </Button>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </Card>
                                    </div>
                                </div>
                            </div>
                            <MobileDealSummary
                                values={values}
                                stepIndex={stepIndex}
                                photoFilesRef={photoFilesRef}
                                open={mobileSummaryOpen}
                                onOpenChange={(next) => {
                                    setMobileSummaryOpen(next);
                                    if (next) setMobileScoreOpen(false);
                                }}
                            />
                        </>
                    ) : (
                        <main
                            className="
                              flex-1 overflow-y-auto bg-surface px-5 py-7 min-block-0 min-inline-0
                              sm:px-6
                            "
                        >
                            <div className="-m-1 p-1">
                                {formBanner ? (
                                    <div
                                        role="alert"
                                        className="
                                          mbe-5 rounded-control border border-danger/30
                                          bg-danger-soft px-4 py-3 text-sm font-medium text-danger
                                        "
                                    >
                                        {formBanner}
                                    </div>
                                ) : null}
                                <QuickAdd photoFilesRef={photoFilesRef} />
                            </div>
                        </main>
                    )}

                    <PropertyFormFooter
                        entryMode={entryMode}
                        stepIndex={stepIndex}
                        stepCount={activeSteps.length}
                        isLastStep={isLastStep}
                        isSubmitting={saving}
                        showStartFresh={mode === "create"}
                        onStartFresh={startFreshListing}
                        onBack={goBack}
                        onNext={() => {
                            if (entryMode === "quick") {
                                void persistProperty("draft");
                                return;
                            }
                            goNext();
                        }}
                    />
                </form>
            </FieldRulesProvider>
        </FormProvider>
    );

    if (!isDialog)
        return (
            <div
                className="
                  flex overflow-hidden rounded-card border border-border-warm bg-surface shadow-sm
                  min-block-[calc(100dvh-7rem)]
                "
            >
                {surface}
            </div>
        );

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) requestClose();
            }}
        >
            <DialogPopup
                showCloseButton={false}
                className="
                  inset-0 flex translate-none flex-col gap-0 overflow-hidden rounded-none border-0
                  p-0 shadow-none block-dvh inline-dvw max-inline-none
                "
            >
                {surface}
            </DialogPopup>
        </Dialog>
    );
}

const ENTRY_MODE_TABS = [
    {
        value: "full" as const,
        label: (
            <>
                <span className="sm:hidden">Full</span>
                <span className="hidden sm:inline">Full details</span>
            </>
        ),
    },
    {
        value: "quick" as const,
        label: (
            <>
                <span className="sm:hidden">Quick</span>
                <span className="hidden sm:inline">Quick add</span>
            </>
        ),
    },
];

function PropertyFormHeader({
    mode,
    entryMode,
    onEntryModeChange,
    isSaved,
    savingIntent,
    onSaveDraft,
    onPublish,
    onClose,
    showClose,
}: {
    mode: "create" | "edit";
    entryMode: "full" | "quick";
    onEntryModeChange: (mode: "full" | "quick") => void;
    isSaved: boolean;
    savingIntent: "draft" | "publish" | null;
    onSaveDraft: () => void;
    onPublish: () => void;
    onClose: () => void;
    showClose: boolean;
}) {
    const title = mode === "edit" ? "Edit property" : "Add property";
    const isBusy = savingIntent != null;
    const savedHint = isSaved ? (
        <span className="body-xs hidden text-ink-subtle sm:inline" aria-live="polite">
            Saved on this device
        </span>
    ) : null;

    return (
        <header
            className="
              flex shrink-0 items-center justify-between gap-3 border-be border-border-warm
              bg-surface px-4 py-2.5
              sm:px-6
            "
        >
            {showClose ? (
                <DialogHeader
                    className="
                      flex flex-1 flex-row items-baseline gap-2.5 pe-0 text-start min-inline-0
                    "
                >
                    <DialogTitle className="truncate">{title}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Property and commission details. Full details walks through every step;
                        Quick add saves the essentials as a draft.
                    </DialogDescription>
                    {savedHint}
                </DialogHeader>
            ) : (
                <div className="flex flex-1 items-baseline gap-2.5 min-inline-0">
                    <h1 className="truncate font-display text-lg font-medium text-ink">{title}</h1>
                    {savedHint}
                </div>
            )}
            <TooltipProvider>
                <div className="flex shrink-0 items-center gap-2">
                    <SlidingTabs
                        value={entryMode}
                        onValueChange={onEntryModeChange}
                        ariaLabel="Entry mode"
                        options={ENTRY_MODE_TABS}
                        className="t-tabs-compact"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        loading={savingIntent === "draft"}
                        disabled={isBusy}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onSaveDraft();
                        }}
                        className="hidden sm:inline-flex"
                    >
                        Save as draft
                    </Button>
                    <Button
                        type="button"
                        variant="accent"
                        loading={savingIntent === "publish"}
                        disabled={isBusy}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onPublish();
                        }}
                    >
                        Publish
                    </Button>
                    {showClose ? (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <DialogClose
                                        onClick={(event) => {
                                            event.preventDefault();
                                            onClose();
                                        }}
                                        render={
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                aria-label="Close"
                                                className="shrink-0"
                                            />
                                        }
                                    />
                                }
                            >
                                <X className="block-4 inline-4" strokeWidth={2} aria-hidden />
                                <span className="sr-only">Close</span>
                            </TooltipTrigger>
                            <TooltipContent side="inline-start">
                                Close
                                <Kbd className="px-1.5 text-[10px] min-inline-4">Esc</Kbd>
                            </TooltipContent>
                        </Tooltip>
                    ) : null}
                </div>
            </TooltipProvider>
        </header>
    );
}

function PropertyFormFooter({
    entryMode,
    stepIndex,
    stepCount,
    isLastStep,
    isSubmitting,
    showStartFresh,
    onStartFresh,
    onBack,
    onNext,
}: {
    entryMode: "full" | "quick";
    stepIndex: number;
    stepCount: number;
    isLastStep: boolean;
    isSubmitting: boolean;
    showStartFresh: boolean;
    onStartFresh: () => void;
    onBack: () => void;
    onNext: () => void;
}) {
    const showBack = entryMode === "full" && stepIndex > 0;
    const showPrimary = entryMode === "quick" || !isLastStep;
    const progressPct = stepCount ? Math.round(((stepIndex + 1) / stepCount) * 100) : 0;
    const primaryLabel = entryMode === "quick" ? "Save as draft" : "Continue";

    return (
        <footer
            className="
              flex shrink-0 items-center gap-3 border-bs border-border-warm bg-surface px-4 py-2.5
              pbe-[calc(0.625rem+env(safe-area-inset-bottom))]
              sm:px-6
            "
        >
            <div className="flex flex-1 items-center gap-3 min-inline-0 md:gap-4">
                {showStartFresh ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onStartFresh}
                        className="shrink-0"
                    >
                        <RotateCcw aria-hidden /> Start fresh
                    </Button>
                ) : null}
                {entryMode === "full" ? (
                    <div className="hidden items-center gap-4 min-inline-0 md:flex">
                        <Progress
                            value={progressPct}
                            className="
                              flex-row flex-nowrap items-center gap-2 max-inline-56 min-inline-40
                              **:data-[slot=progress-indicator]:bg-brand
                              **:data-[slot=progress-track]:flex-1
                              **:data-[slot=progress-track]:bg-surface-muted
                              **:data-[slot=progress-track]:block-1.5
                            "
                        >
                            <ProgressLabel className="body-xs tabular shrink-0 font-medium text-ink-subtle">
                                {stepIndex + 1} of {stepCount}
                            </ProgressLabel>
                        </Progress>
                        <p className="body-xs flex flex-wrap items-center gap-1.5 text-ink-subtle">
                            Press
                            <KbdGroup className="gap-1">
                                <Kbd className="px-1.5 text-[10px] min-inline-4">1</Kbd>
                                <span aria-hidden>–</span>
                                <Kbd className="px-1.5 text-[10px] min-inline-4">5</Kbd>
                            </KbdGroup>
                            to jump steps
                        </p>
                    </div>
                ) : null}
            </div>
            <div className="ms-auto flex shrink-0 items-center gap-2">
                {showBack ? (
                    <Button type="button" variant="ghost" onClick={onBack}>
                        Back
                    </Button>
                ) : null}
                {showPrimary ? (
                    <Button
                        type="button"
                        variant="outline"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={onNext}
                    >
                        {primaryLabel}
                        <KbdGroup className="hidden gap-0.5 md:inline-flex">
                            <Kbd className="px-1.5 text-[10px] min-inline-4">Ctrl</Kbd>
                            <span className="text-[10px] text-ink-subtle" aria-hidden>
                                +
                            </span>
                            <Kbd className="px-1.5 text-[10px] min-inline-4">Enter</Kbd>
                        </KbdGroup>
                    </Button>
                ) : null}
            </div>
        </footer>
    );
}

function StepContent({
    step,
    photoFilesRef,
}: {
    step: PropertyFormStep;
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    if (step === "basics") {
        return (
            <div className="flex flex-col gap-8">
                <StepBasics />
                <StepLocation />
            </div>
        );
    }
    if (step === "details") {
        return (
            <div className="flex flex-col gap-8">
                <StepDetails />
                <StepArea />
            </div>
        );
    }
    if (step === "pricing") {
        return (
            <div className="flex flex-col gap-8">
                <StepPricing />
                <StepCommission />
            </div>
        );
    }
    if (step === "furnishing") {
        return <StepFurnishing />;
    }
    return (
        <div className="flex flex-col gap-8">
            <StepMedia photoFilesRef={photoFilesRef} />
            <StepPublish />
        </div>
    );
}

function StepTransition({ step, children }: { step: PropertyFormStep; children: ReactNode }) {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(frame);
    }, [step]);
    return <div className={cn("t-auth-enter -m-1 p-1", shown && "is-shown")}>{children}</div>;
}

function MobileListingScore({
    score,
    tips,
    open,
    onOpenChange,
    onTip,
}: {
    score: number;
    tips: { label: string; step: PropertyFormStep; points: number }[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTip: (step: PropertyFormStep) => void;
}) {
    return (
        <div className="border-brand-hover border-bs bg-brand-ink text-surface xl:hidden">
            <Button
                type="button"
                variant="ghost"
                aria-expanded={open}
                aria-controls="mobile-listing-score-panel"
                onClick={() => onOpenChange(!open)}
                className="
                  hover:bg-brand-hover
                  flex items-center justify-between gap-3 px-4 text-start text-surface inline-full
                  min-block-11
                  focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-inset
                "
            >
                <span className="flex items-center gap-2 text-xs font-semibold text-surface">
                    <span
                        className="
                          tabular flex items-center justify-center rounded-full bg-highlight
                          text-brand-ink block-7 inline-7
                        "
                    >
                        {score}%
                    </span>
                    Listing score
                </span>
                <span className="flex items-center gap-2 text-xs text-surface/80 min-inline-0">
                    <span className="hidden truncate sm:block">
                        {tips[0]?.label ?? "Ready to publish"}
                    </span>
                    <ChevronDown
                        className={cn(
                            "shrink-0 transition-transform duration-160 block-4 inline-4",
                            open && `rotate-180`,
                        )}
                        aria-hidden
                    />
                </span>
            </Button>
            {open ? (
                <div
                    id="mobile-listing-score-panel"
                    data-open={open}
                    className="
                      t-panel-slide absolute inset-x-0
                      inset-be-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 overflow-y-auto
                      border-bs border-border-warm bg-surface p-4 shadow-xl max-block-[60dvh]
                    "
                >
                    <div className="mx-auto max-inline-md">
                        <div className="flex items-center gap-4">
                            <ListingScoreRing score={score} />
                            <div>
                                <p className="font-bold text-ink">Listing score</p>
                                <p className="mbs-1 text-sm/5 text-ink-muted">
                                    Add useful details to improve broker confidence.
                                </p>
                            </div>
                        </div>
                        <div className="mbs-4 space-y-2">
                            {tips.map((tip) => (
                                <Button
                                    key={tip.label}
                                    type="button"
                                    variant="outline"
                                    size="md"
                                    onClick={() => onTip(tip.step)}
                                    className="
                                      flex items-center justify-between gap-3 rounded-control border
                                      border-border-warm bg-canvas px-3 text-start text-sm text-ink
                                      inline-full min-block-11
                                      hover:border-brand/40 hover:bg-brand-soft
                                      focus-visible:ring-3 focus-visible:ring-ring/30
                                    "
                                >
                                    <span>{tip.label}</span>
                                    <span className="tabular font-semibold text-brand-text">
                                        +{tip.points}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function MobileDealSummary({
    values,
    stepIndex,
    photoFilesRef,
    open,
    onOpenChange,
}: {
    values: PropertyDraftValues;
    stepIndex: number;
    photoFilesRef: MutableRefObject<Map<string, File>>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    if (stepIndex < 4) return null;
    return (
        <div className="shrink-0 xl:hidden">
            <Button
                type="button"
                variant="ghost"
                aria-expanded={open}
                aria-controls="mobile-deal-summary-panel"
                onClick={() => onOpenChange(!open)}
                className="
                  flex items-center justify-between gap-4 bg-brand-ink px-4 text-start inline-full
                  min-block-14
                  focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-inset
                "
            >
                <div className="flex-1 min-inline-0">
                    <LiveSummaryPanel values={values} stepIndex={stepIndex} compact />
                </div>
                <ChevronDown
                    className={cn(
                        `text-surface transition-transform duration-160 block-5 inline-5`,
                        open && `rotate-180`,
                    )}
                    aria-hidden
                />
            </Button>
            {open ? (
                <div
                    id="mobile-deal-summary-panel"
                    className="
                      t-panel-slide absolute inset-x-0
                      inset-be-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 overflow-y-auto
                      bg-canvas shadow-xl max-block-[72dvh]
                    "
                    data-open={open}
                >
                    <div className="mx-auto p-4 max-inline-md">
                        <LiveSummaryPanel
                            values={values}
                            stepIndex={stepIndex}
                            photoFilesRef={photoFilesRef}
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function cloneDefaultDraft(): PropertyDraftValues {
    return JSON.parse(JSON.stringify(DEFAULT_PROPERTY_DRAFT)) as PropertyDraftValues;
}

function mergeDraft(
    base: PropertyDraftValues,
    saved: Partial<PropertyDraftValues>,
): PropertyDraftValues {
    const merged = { ...base, ...saved } as PropertyDraftValues;
    for (const key of Object.keys(base) as (keyof PropertyDraftValues)[]) {
        if (base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
            (merged as Record<string, unknown>)[key] = {
                ...(base[key] as object),
                ...((saved[key] as object | undefined) ?? {}),
            };
        }
    }
    merged.media.photos = (merged.media.photos ?? []).filter(
        (photo) => Boolean(photo.url) && !photo.url.startsWith("blob:"),
    );
    // Local extras often strip blob previews after upload, leaving photos: [].
    // Never let that wipe server photos already on the listing.
    const basePhotos = (base.media?.photos ?? []).filter(
        (photo) => Boolean(photo.url) && !photo.url.startsWith("blob:"),
    );
    if (merged.media.photos.length === 0 && basePhotos.length > 0) {
        merged.media.photos = basePhotos;
    }
    merged.attachedBuyers = Array.isArray(merged.attachedBuyers) ? merged.attachedBuyers : [];
    if (!merged.owner.contactId) merged.owner.contactId = "";
    // Legacy drafts may still store removed commission pickers ("months", etc.).
    merged.commission.sale.mode = "percent";
    merged.commission.sale.paidBy = "owner";
    merged.commission.rent.mode = "flat";
    merged.commission.rent.paidBy = "owner";
    return merged;
}

function draftForStorage(values: PropertyDraftValues): PropertyDraftValues {
    const safe = JSON.parse(JSON.stringify(values)) as PropertyDraftValues;
    safe.media.photos = safe.media.photos.filter(
        (photo) => Boolean(photo.url) && !photo.url.startsWith("blob:"),
    );
    return safe;
}

function listingToDraft(listing: MyListingItem): PropertyDraftValues {
    const draft = cloneDefaultDraft();
    draft.basics.listingFor =
        listing.transactionType === "sale"
            ? "sell"
            : listing.transactionType === "both"
              ? "both"
              : "rent";
    draft.basics.category = listing.category;
    draft.basics.propertyType = legacyPropertyTypeToDraft(listing.propertyType);
    draft.basics.title = listing.title;
    draft.basics.description = listing.description;
    draft.location.city = listing.city;
    draft.location.locality = listing.locality;
    draft.location.streetOrRoad = listing.address;
    draft.location.landmark = listing.landmark || listing.address || listing.locality;
    draft.location.pincode = listing.pinCode;
    draft.location.projectOrSociety = listing.society || "";
    draft.details.bedrooms = String(listing.bhk || 2);
    draft.details.bathrooms = listing.bathrooms;
    draft.details.balconies = listing.balconies;
    draft.details.floorNumber = listing.floorNumber ?? null;
    draft.details.totalFloors = listing.totalFloors;
    draft.details.facing = listing.facing ?? "";
    draft.details.coveredParking =
        listing.parking === "none" ? 0 : listing.parking === "3plus" ? 3 : Number(listing.parking);
    draft.area.carpetArea = listing.areaSqft;
    draft.area.areaSqft = listing.areaSqft;
    draft.sale.expectedPrice = listing.saleAmountInr;
    draft.sale.pricePerSqft =
        listing.saleAmountInr && listing.areaSqft
            ? Math.round(listing.saleAmountInr / listing.areaSqft)
            : null;
    draft.rent.monthlyRent = listing.rentAmountInr;
    draft.sale.maintenanceCharge = listing.maintenanceInr;
    draft.rent.maintenanceAmount = listing.maintenanceInr;
    draft.rent.securityDeposit = listing.securityDeposit;
    draft.rent.securityDepositMode = listing.securityDepositMode ?? "months_of_rent";
    draft.commission.sale.value = listing.commissionPercent ?? draft.commission.sale.value;
    draft.commission.rent.mode = "flat";
    draft.commission.rent.value = listing.commissionAmount ?? 0;
    draft.rent.availableFrom = listing.availableFrom ?? "";
    draft.furnishing.status =
        listing.furnishing === "furnished"
            ? "fully_furnished"
            : listing.furnishing === "semi"
              ? "semi_furnished"
              : "unfurnished";
    draft.amenities.society = listing.amenities;
    draft.location.nearbyPlaces = listing.nearbyPlaces ?? [];
    draft.details.commercial.suitableFor = listing.suitableFor ?? [];
    draft.details.commercial.cabins = listing.cabins ?? null;
    draft.details.commercial.meetingRooms = listing.meetingRooms ?? null;
    draft.details.commercial.workstations = listing.workstations ?? null;
    draft.details.commercial.ceilingHeightFt = listing.ceilingHeightFt ?? null;
    draft.media.videoUrl = listing.videoUrl ?? "";
    draft.media.virtualTourUrl = listing.virtualTourUrl ?? "";
    draft.media.photos = listing.imageSrcs.map((url, index) => ({
        id: `existing-${index}`,
        url,
        name: `Property photo ${index + 1}`,
        tag: "other",
        isCover: index === 0,
        order: index,
        alt: listing.title,
        status: "ready",
    }));
    draft.publish.status = listing.status === "published" ? "active" : "draft";
    return draft;
}

function legacyPropertyTypeToDraft(value: MyListingPropertyType): string {
    if (value === "farmhouse") return "farm_house";
    if (value === "flat") return "apartment";
    if (value === "office") return "office_space";
    if (value === "plot") return "residential_plot";
    if (value === "agricultural") return "agricultural_land";
    return value;
}

function draftPropertyTypeToLegacy(values: PropertyDraftValues): MyListingPropertyType {
    const value = values.basics.propertyType;
    const direct = [
        "apartment",
        "villa",
        "independent_house",
        "builder_floor",
        "penthouse",
        "shop",
        "showroom",
        "warehouse",
        "factory",
    ];
    if (direct.includes(value)) return value as MyListingPropertyType;
    if (value === "farm_house") return "farmhouse";
    if (
        ["office_space", "coworking_space", "business_center", "commercial_building"].includes(
            value,
        )
    )
        return "office";
    if (["retail_space", "restaurant_space"].includes(value)) return "shop";
    if (["godown", "industrial_shed", "cold_storage"].includes(value)) return "warehouse";
    if (
        ["residential_plot", "commercial_plot", "industrial_plot", "na_plot", "farm_land"].includes(
            value,
        )
    )
        return "plot";
    if (["agricultural_land", "orchard", "poultry_farm"].includes(value)) return "agricultural";
    return "apartment";
}

function draftToLegacyInput(
    values: PropertyDraftValues,
    photoFilesRef: MutableRefObject<Map<string, File>>,
): CreateMyListingInput {
    const propertyType = draftPropertyTypeToLegacy(values);
    const bhk = values.details.bedrooms === "1rk" ? 1 : Number(values.details.bedrooms) || 0;
    const usablePhotos = values.media.photos.filter(
        (photo) => photo.status !== "error" && Boolean(photo.url),
    );
    const imageSrcs = usablePhotos.map((photo) => photo.url);
    const photoFiles = usablePhotos
        .map((photo) => photoFilesRef.current.get(photo.url) ?? photoFilesRef.current.get(photo.id))
        .filter((file): file is File => Boolean(file))
        .slice(0, 10);
    const listingFor = values.basics.listingFor;
    const transactionType =
        listingFor === "sell" ? "sale" : listingFor === "both" ? "both" : "rent";
    const generatedTitle =
        buildBasicsSuggestedTitle({
            bedrooms: values.details.bedrooms,
            propertyType: values.basics.propertyType,
            locality: values.location.locality,
            city: values.location.city,
        }) ||
        [
            bhk ? `${bhk} BHK` : null,
            toLabel(values.basics.propertyType),
            values.location.locality
                ? `in ${values.location.locality}, ${values.location.city}`
                : null,
        ]
            .filter(Boolean)
            .join(" ");
    const amenities = Object.values(values.amenities).flat();
    const parking = values.details.coveredParking ?? 0;
    return {
        transactionType,
        category: values.basics.category === "agricultural" ? "land" : values.basics.category,
        propertyType,
        bhk,
        title: values.basics.title.trim() || generatedTitle,
        locality: values.location.locality,
        city: values.location.city,
        address: values.location.streetOrRoad || values.location.fullAddress,
        pinCode: values.location.pincode,
        landmark: values.location.landmark,
        society: values.location.projectOrSociety,
        saleAmountInr:
            transactionType === "sale" || transactionType === "both"
                ? values.sale.expectedPrice
                : null,
        rentAmountInr:
            transactionType === "rent" || transactionType === "both"
                ? values.rent.monthlyRent
                : null,
        areaSqft: values.area.areaSqft,
        furnishing:
            values.furnishing.status === "fully_furnished"
                ? "furnished"
                : values.furnishing.status === "semi_furnished"
                  ? "semi"
                  : "unfurnished",
        imageSrcs,
        photoFiles,
        bathrooms: values.details.bathrooms,
        balconies: values.details.balconies,
        floorNumber: values.details.floorNumber,
        totalFloors: values.details.totalFloors,
        facing: (values.details.facing || null) as CreateMyListingInput["facing"],
        parking: parking <= 0 ? "none" : parking === 1 ? "1" : parking === 2 ? "2" : "3plus",
        maintenanceInr: values.sale.maintenanceCharge ?? values.rent.maintenanceAmount ?? null,
        availableFrom:
            transactionType === "rent" || transactionType === "both"
                ? values.rent.availableFrom || null
                : null,
        securityDeposit:
            transactionType === "rent" || transactionType === "both"
                ? values.rent.securityDeposit
                : null,
        securityDepositMode:
            transactionType === "rent" || transactionType === "both"
                ? values.rent.securityDepositMode
                : null,
        commissionPercent:
            transactionType === "sale" || transactionType === "both"
                ? values.commission.sale.value
                : null,
        commissionAmount:
            transactionType === "rent" || transactionType === "both"
                ? values.commission.rent.value
                : null,
        description: values.basics.description,
        amenities,
        nearbyPlaces: values.location.nearbyPlaces ?? [],
        suitableFor: values.details.commercial.suitableFor ?? [],
        cabins: values.details.commercial.cabins ?? null,
        meetingRooms: values.details.commercial.meetingRooms ?? null,
        workstations: values.details.commercial.workstations ?? null,
        ceilingHeightFt: values.details.commercial.ceilingHeightFt ?? null,
        videoUrl: values.media.videoUrl?.trim() || "",
        virtualTourUrl: values.media.virtualTourUrl?.trim() || "",
        publish: values.publish.status === "active",
        exclusiveOwnerId: values.owner.contactId.trim() || null,
    };
}

/** Only fields shown on the Quick add surface — never full-details requirements. */
function validateQuickDraft(values: PropertyDraftValues): string | null {
    if (!values.basics.listingFor) return "Choose listing for (sale, rent, or both).";
    if (!values.basics.category) return "Choose a category.";
    if (!values.basics.propertyType) return "Choose a property type.";
    if (!values.location.city.trim()) return "Choose a city.";
    if (!values.location.locality.trim()) return "Enter the locality.";
    const area = values.area.areaSqft || values.area.plotArea || values.area.carpetArea;
    if (!area) return "Enter the area.";
    const listingFor = values.basics.listingFor;
    if ((listingFor === "sell" || listingFor === "both") && !values.sale.expectedPrice)
        return "Enter the sale price.";
    if ((listingFor === "rent" || listingFor === "both") && !values.rent.monthlyRent)
        return "Enter the rent.";
    if (!values.media.photos.length) return "Add one property photo.";
    return null;
}
