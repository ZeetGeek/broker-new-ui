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

import { ChevronDown, ChevronLeft, ChevronRight, RotateCcw, X } from "lucide-react";

import { myListingsApi } from "@/lib/api/my-listings";
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
import { isStepVisible as ruleStepIsVisible, stripHidden } from "@/lib/visibility/rules";
import { FieldRulesProvider, useFieldRules } from "@/lib/visibility/use-field-rules";

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
import { Kbd } from "@/components/ui/kbd";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
import { StepHighlights } from "@/features/properties/property-form/steps/step-highlights";
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
const LOCAL_DRAFT_VERSION = 4;

const STEP_DESCRIPTIONS: Record<PropertyFormStep, string> = {
    basics: "Choose the deal type and property shape.",
    location: "Pin the property and control what people can see.",
    details: "Record the configuration, condition, and approvals.",
    area: "Capture measurements in the owner's preferred unit.",
    pricing: "Make the full sale or rental cost clear.",
    commission: "Agree who pays the broker and how much.",
    furnishing: "Count what stays and group the amenities.",
    highlights: "Explain why it is worth a visit and when it is available.",
    media: "Add listing media and private deal documents.",
    publish: "Confirm the owner record and visibility.",
};

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
    const [recoveryDraft, setRecoveryDraft] = useState<PropertyDraftValues | null>(null);
    const [formBanner, setFormBanner] = useState<string | null>(null);
    const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
    const [mobileScoreOpen, setMobileScoreOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [networkSavedAt, setNetworkSavedAt] = useState<Date | null>(null);
    const photoFilesRef = useRef<Map<string, File>>(new Map());
    const autosaveReadyRef = useRef(false);
    const recoveryCheckedRef = useRef(false);
    const networkSaveBusyRef = useRef(false);
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
    const activeSteps = useMemo(
        () => FORM_STEPS.filter((item) => ruleStepIsVisible(item.id, values)),
        [values],
    );
    const stepIndex = activeSteps.findIndex((item) => item.id === step);
    const isLastStep = stepIndex === activeSteps.length - 1;
    const isPublishing = values.publish.status === "active";

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
            const stored = window.localStorage.getItem(localStorageKey);
            if (!stored) {
                autosaveReadyRef.current = true;
                return;
            }
            const parsed = JSON.parse(stored) as { values?: Partial<PropertyDraftValues> };
            if (parsed.values) {
                const recovered = mergeDraft(cloneDefaultDraft(), parsed.values);
                const timer = window.setTimeout(() => setRecoveryDraft(recovered), 0);
                return () => window.clearTimeout(timer);
            }
            autosaveReadyRef.current = true;
        } catch {
            window.localStorage.removeItem(localStorageKey);
            autosaveReadyRef.current = true;
        }
    }, [formIsActive, localStorageKey, mode]);

    useEffect(() => {
        if (!formIsActive || !autosaveReadyRef.current) return;
        const timer = window.setTimeout(() => {
            try {
                const safe = draftForStorage(values);
                window.localStorage.setItem(
                    localStorageKey,
                    JSON.stringify({
                        version: LOCAL_DRAFT_VERSION,
                        savedAt: new Date().toISOString(),
                        values: safe,
                    }),
                );
                setSavedAt(new Date());
            } catch {
                // A private browser mode may reject storage; the form itself remains usable.
            }
        }, 500);
        return () => window.clearTimeout(timer);
    }, [formIsActive, localStorageKey, values]);

    const syncLegacyProjection = useCallback(async () => {
        if (!formIsActive || mode !== "edit" || !propertyId || networkSaveBusyRef.current) return;
        networkSaveBusyRef.current = true;
        try {
            const current = methods.getValues();
            const updated = await myListingsApi.update(propertyId, {
                ...draftToLegacyInput(current, photoFilesRef),
                status: current.publish.status === "active" ? "published" : "draft",
            });
            if (updated) setNetworkSavedAt(new Date());
        } catch {
            // The device copy remains the source of truth until a later sync succeeds.
        } finally {
            networkSaveBusyRef.current = false;
        }
    }, [formIsActive, methods, mode, propertyId]);

    useEffect(() => {
        if (!formIsActive || mode !== "edit" || !propertyId) return;
        const interval = window.setInterval(() => void syncLegacyProjection(), 10_000);
        return () => window.clearInterval(interval);
    }, [formIsActive, mode, propertyId, syncLegacyProjection]);

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
                if (
                    targetStep &&
                    FORM_STEPS.findIndex((item) => item.id === targetStep.id) <= highestUnlocked
                )
                    setStep(targetStep.id);
            }
            if (!event.ctrlKey && !event.metaKey && event.key === "0") {
                const targetStep = activeSteps[9];
                if (
                    targetStep &&
                    FORM_STEPS.findIndex((item) => item.id === targetStep.id) <= highestUnlocked
                )
                    setStep(targetStep.id);
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    });

    function saveDraftLocally() {
        try {
            window.localStorage.setItem(
                localStorageKey,
                JSON.stringify({
                    version: LOCAL_DRAFT_VERSION,
                    savedAt: new Date().toISOString(),
                    values: draftForStorage(methods.getValues()),
                }),
            );
            setSavedAt(new Date());
            toast.success("Draft saved on this device.");
        } catch {
            toast.error("Couldn't save the local draft.");
        }
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
        for (const issue of issues) {
            const path = issue.path.join(".") as FieldPath<PropertyDraftValues>;
            methods.setError(path, { type: "zod", message: issue.message });
        }
        const issueCount = issues.length;
        setFormBanner(
            `${issueCount} field${issueCount === 1 ? "" : "s"} need attention before continuing.`,
        );
        return false;
    }

    function changeStep(next: PropertyFormStep) {
        const nextIndex = FORM_STEPS.findIndex((item) => item.id === next);
        if (nextIndex > highestUnlocked) return;
        setFormBanner(null);
        setMobileSummaryOpen(false);
        setMobileScoreOpen(false);
        setStep(next);
        saveSilent();
        void syncLegacyProjection();
    }

    function goBack() {
        if (stepIndex <= 0) return;
        changeStep(activeSteps[stepIndex - 1]!.id);
    }

    function goNext() {
        setFormBanner(null);
        if (!validateStep(step)) return;
        setCompletedSteps((current) => new Set(current).add(step));
        const next = activeSteps[stepIndex + 1];
        if (!next) return;
        const nextOriginalIndex = FORM_STEPS.findIndex((item) => item.id === next.id);
        setHighestUnlocked((current) => Math.max(current, nextOriginalIndex));
        setStep(next.id);
        setMobileSummaryOpen(false);
        setMobileScoreOpen(false);
        saveSilent();
        void syncLegacyProjection();
    }

    function saveSilent() {
        try {
            window.localStorage.setItem(
                localStorageKey,
                JSON.stringify({
                    version: LOCAL_DRAFT_VERSION,
                    savedAt: new Date().toISOString(),
                    values: draftForStorage(methods.getValues()),
                }),
            );
            setSavedAt(new Date());
        } catch {
            // Keep navigating even if storage is unavailable.
        }
    }

    async function persistProperty(forceDraft = false) {
        setFormBanner(null);
        const current = methods.getValues();
        if (!forceDraft && current.publish.status === "active") {
            const required = activeSteps.map((item) => item.id);
            for (const requiredStep of required) {
                if (!validateStep(requiredStep)) {
                    const problemIndex = FORM_STEPS.findIndex((item) => item.id === requiredStep);
                    setHighestUnlocked((value) => Math.max(value, problemIndex));
                    setStep(requiredStep);
                    return;
                }
            }
        }
        if (forceDraft && entryMode === "quick") {
            const quickProblem = validateQuickDraft(current);
            if (quickProblem) {
                setFormBanner(quickProblem);
                return;
            }
        }

        const input = draftToLegacyInput(stripHidden(current), photoFilesRef);
        setSaving(true);
        try {
            if (mode === "edit" && propertyId) {
                const updated = await myListingsApi.update(propertyId, {
                    ...input,
                    status:
                        forceDraft || current.publish.status !== "active" ? "draft" : "published",
                });
                if (!updated) {
                    setFormBanner("Couldn't find that property.");
                    return;
                }
                finishSave(updated, forceDraft || current.publish.status !== "active");
                return;
            }
            const created = await myListingsApi.create({
                ...input,
                publish: !forceDraft && current.publish.status === "active",
            });
            finishSave(created, forceDraft || current.publish.status !== "active");
        } catch {
            setFormBanner(
                "Couldn't save to the current API. Your complete draft is still saved on this device.",
            );
        } finally {
            setSaving(false);
        }
    }

    function finishSave(listing: MyListingItem, draft: boolean) {
        try {
            window.localStorage.setItem(
                `property-extra:v${LOCAL_DRAFT_VERSION}:${listing.id}`,
                JSON.stringify({
                    savedAt: new Date().toISOString(),
                    values: draftForStorage(methods.getValues()),
                }),
            );
        } catch {
            // The existing API save still succeeded; unsupported fields remain best-effort local data.
        }
        window.localStorage.removeItem(localStorageKey);
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
            void persistProperty(true);
            return;
        }
        if (isLastStep) void persistProperty(false);
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
        event.preventDefault();
        if (entryMode === "quick") void persistProperty(true);
        else if (isLastStep) void persistProperty(false);
        else goNext();
    }

    function requestClose() {
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
                        isSaved={Boolean(savedAt || networkSavedAt)}
                        onSaveDraft={saveDraftLocally}
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
                                      hidden overflow-y-auto border-e border-border-warm bg-surface
                                      px-4 py-6
                                      xl:block
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
                                      overflow-y-auto bg-canvas px-4 py-6 min-block-0
                                      sm:px-6
                                      lg:px-10
                                    "
                                >
                                    <div className="mx-auto pbe-8 max-inline-3xl">
                                        {recoveryDraft ? (
                                            <RecoveryBanner
                                                onContinue={() => {
                                                    autosaveReadyRef.current = true;
                                                    methods.reset(recoveryDraft);
                                                    setRecoveryDraft(null);
                                                    toast.success("Draft restored.");
                                                }}
                                                onStartFresh={() => {
                                                    autosaveReadyRef.current = true;
                                                    window.localStorage.removeItem(localStorageKey);
                                                    setRecoveryDraft(null);
                                                    methods.reset(defaultValues);
                                                }}
                                            />
                                        ) : null}
                                        <div className="mbe-7">
                                            <p className="text-sm font-semibold text-brand-text">
                                                Step {stepIndex + 1} of {activeSteps.length}
                                            </p>
                                            <h1
                                                className="
                                                  mbs-1 text-3xl font-bold tracking-[-0.03em]
                                                  text-ink
                                                  sm:text-4xl
                                                "
                                            >
                                                {activeSteps[stepIndex]?.label}
                                            </h1>
                                            <p
                                                className="
                                              mbs-2 text-sm/6 text-ink-muted max-inline-2xl
                                            "
                                            >
                                                {STEP_DESCRIPTIONS[step]}
                                            </p>
                                            <StepRequiredStatus step={step} />
                                        </div>
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
                                      hidden overflow-y-auto border-s border-border-warm bg-surface
                                      p-5 min-block-0
                                      xl:block
                                    "
                                >
                                    <LiveSummaryPanel values={values} stepIndex={stepIndex} />
                                    <Card
                                        className="
                                          mbs-5 gap-0 rounded-card border border-border-warm
                                          bg-surface-muted p-4 shadow-none
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
                                                          flex items-center justify-between gap-3
                                                          rounded-control px-2 text-start text-xs
                                                          text-ink-muted inline-full min-block-9
                                                          hover:bg-surface hover:text-ink
                                                          focus-visible:ring-3
                                                          focus-visible:ring-ring/30
                                                        "
                                                    >
                                                        <span>{tip.label}</span>
                                                        <span className="tabular text-brand-text">
                                                            +{tip.points}
                                                        </span>
                                                    </Button>
                                                ))}
                                            </div>
                                        ) : null}
                                    </Card>
                                </div>
                            </div>
                            <MobileDealSummary
                                values={values}
                                stepIndex={stepIndex}
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
                              flex-1 overflow-y-auto bg-canvas px-4 py-7 min-block-0
                              sm:px-6
                              lg:px-10
                            "
                        >
                            {formBanner ? (
                                <div
                                    role="alert"
                                    className="
                                      mx-auto mbe-5 rounded-control border border-danger/30
                                      bg-danger-soft px-4 py-3 text-sm font-medium text-danger
                                      max-inline-3xl
                                    "
                                >
                                    {formBanner}
                                </div>
                            ) : null}
                            <QuickAdd photoFilesRef={photoFilesRef} />
                        </main>
                    )}

                    <PropertyFormFooter
                        entryMode={entryMode}
                        stepIndex={stepIndex}
                        isLastStep={isLastStep}
                        isPublishing={isPublishing}
                        isSubmitting={saving}
                        onBack={stepIndex === 0 ? requestClose : goBack}
                        onNext={() =>
                            entryMode === "quick" || isLastStep
                                ? void persistProperty(entryMode === "quick")
                                : goNext()
                        }
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
    onSaveDraft,
    onClose,
    showClose,
}: {
    mode: "create" | "edit";
    entryMode: "full" | "quick";
    onEntryModeChange: (mode: "full" | "quick") => void;
    isSaved: boolean;
    onSaveDraft: () => void;
    onClose: () => void;
    showClose: boolean;
}) {
    const title = mode === "edit" ? "Edit property" : "Add property";
    const savedHint = isSaved ? (
        <span className="body-xs hidden text-ink-subtle sm:inline" aria-live="polite">
            Saved
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
                    />
                    <Button type="button" onClick={onSaveDraft} className="hidden md:inline-flex">
                        Save draft
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
                                                size="icon-sm"
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
    isLastStep,
    isPublishing,
    isSubmitting,
    onBack,
    onNext,
}: {
    entryMode: "full" | "quick";
    stepIndex: number;
    isLastStep: boolean;
    isPublishing: boolean;
    isSubmitting: boolean;
    onBack: () => void;
    onNext: () => void;
}) {
    const { missingRequiredFields: getMissingRequiredFields } = useFieldRules();
    const missing = getMissingRequiredFields();
    const publishBlocked = entryMode === "full" && isLastStep && isPublishing && missing.length > 0;
    const primaryLabel =
        entryMode === "quick"
            ? "Save quick draft"
            : isLastStep
              ? isPublishing
                  ? "Publish property"
                  : "Save property"
              : "Continue";
    return (
        <footer
            className="
              flex shrink-0 items-center justify-between gap-3 border-bs border-border-warm
              bg-surface px-4 py-3 pbe-[calc(0.75rem+env(safe-area-inset-bottom))]
              sm:px-6
            "
        >
            <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onBack}
                disabled={entryMode === "quick" && false}
                className={entryMode === "quick" ? `invisible` : undefined}
            >
                <ChevronLeft aria-hidden /> {stepIndex === 0 ? "Close" : "Back"}
            </Button>
            <div className="hidden text-xs text-ink-muted md:block">
                Enter moves forward · Ctrl+S saves · 1–0 jumps to unlocked steps
            </div>
            <Button
                type="button"
                size="lg"
                loading={isSubmitting}
                disabled={isSubmitting || publishBlocked}
                title={
                    publishBlocked
                        ? `Still required: ${missing.map((item) => item.label).join(", ")}`
                        : undefined
                }
                onClick={onNext}
                className="bg-brand-ink text-surface hover:bg-brand-deep"
            >
                {primaryLabel}{" "}
                {entryMode === "full" && !isLastStep ? <ChevronRight aria-hidden /> : null}
            </Button>
        </footer>
    );
}

function StepRequiredStatus({ step }: { step: PropertyFormStep }) {
    const { requiredLeftInStep } = useFieldRules();
    const remaining = requiredLeftInStep(step).length;
    return (
        <p
            className={cn(
                "text-xs font-semibold",
                remaining ? "text-ink-muted" : "text-brand-text",
            )}
        >
            {remaining
                ? `${remaining} required field${remaining === 1 ? "" : "s"} left`
                : "All required fields done ✓"}
        </p>
    );
}

function StepContent({
    step,
    photoFilesRef,
}: {
    step: PropertyFormStep;
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    if (step === "basics") return <StepBasics />;
    if (step === "location") return <StepLocation />;
    if (step === "details") return <StepDetails />;
    if (step === "area") return <StepArea />;
    if (step === "pricing") return <StepPricing />;
    if (step === "commission") return <StepCommission />;
    if (step === "furnishing") return <StepFurnishing />;
    if (step === "highlights") return <StepHighlights />;
    if (step === "media") return <StepMedia photoFilesRef={photoFilesRef} />;
    return <StepPublish />;
}

function StepTransition({ step, children }: { step: PropertyFormStep; children: ReactNode }) {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setShown(true));
        return () => cancelAnimationFrame(frame);
    }, [step]);
    return <div className={cn("t-auth-enter", shown && "is-shown")}>{children}</div>;
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
    open,
    onOpenChange,
}: {
    values: PropertyDraftValues;
    stepIndex: number;
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
                        <LiveSummaryPanel values={values} stepIndex={stepIndex} />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function RecoveryBanner({
    onContinue,
    onStartFresh,
}: {
    onContinue: () => void;
    onStartFresh: () => void;
}) {
    return (
        <div
            className="
              mbe-6 rounded-card border border-brand/20 bg-brand-soft p-4
              sm:flex sm:items-center sm:justify-between sm:gap-4
            "
        >
            <div>
                <p className="text-sm font-bold text-brand-ink">
                    Continue your unfinished property?
                </p>
                <p className="mbs-1 text-sm text-brand-text">
                    A draft from this device is ready to restore.
                </p>
            </div>
            <div className="mbs-3 flex gap-2 sm:mbs-0">
                <Button
                    type="button"
                    size="sm"
                    onClick={onContinue}
                    className="bg-brand-ink text-surface"
                >
                    Continue
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={onStartFresh}>
                    <RotateCcw aria-hidden /> Start fresh
                </Button>
            </div>
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
    draft.basics.listingFor = listing.transactionType === "sale" ? "sell" : "rent";
    draft.basics.category = listing.category;
    draft.basics.propertyType = legacyPropertyTypeToDraft(listing.propertyType);
    draft.basics.title = listing.title;
    draft.basics.description = listing.description;
    draft.location.city = listing.city;
    draft.location.locality = listing.locality;
    draft.location.streetOrRoad = listing.address;
    draft.location.landmark = listing.address || listing.locality;
    draft.location.pincode = listing.pinCode;
    draft.details.bedrooms = String(listing.bhk || 2);
    draft.details.bathrooms = listing.bathrooms;
    draft.details.balconies = listing.balconies;
    draft.details.floorNumber = listing.floorNumber == null ? "" : String(listing.floorNumber);
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
    draft.rent.availableFrom = listing.availableFrom ?? "";
    draft.furnishing.status =
        listing.furnishing === "furnished"
            ? "fully_furnished"
            : listing.furnishing === "semi"
              ? "semi_furnished"
              : "unfurnished";
    draft.amenities.society = listing.amenities;
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
    const transactionType = listingFor === "sell" ? "sale" : "rent";
    const generatedTitle = [
        bhk ? `${bhk} BHK` : null,
        toLabel(values.basics.propertyType),
        transactionType === "sale" ? "for Sale" : "for Rent",
        values.location.locality ? `in ${values.location.locality}, ${values.location.city}` : null,
    ]
        .filter(Boolean)
        .join(" ");
    const amenities = Object.values(values.amenities).flat();
    const parking = (values.details.coveredParking ?? 0) + (values.details.openParking ?? 0);
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
        saleAmountInr: transactionType === "sale" ? values.sale.expectedPrice : null,
        rentAmountInr: transactionType === "rent" ? values.rent.monthlyRent : null,
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
        floorNumber: Number(values.details.floorNumber) || null,
        totalFloors: values.details.totalFloors,
        facing: (values.details.facing || null) as CreateMyListingInput["facing"],
        parking: parking <= 0 ? "none" : parking === 1 ? "1" : parking === 2 ? "2" : "3plus",
        maintenanceInr:
            transactionType === "sale"
                ? values.sale.maintenanceCharge
                : values.rent.maintenanceAmount,
        availableFrom: transactionType === "rent" ? values.rent.availableFrom || null : null,
        description: values.basics.description,
        amenities,
        publish: values.publish.status === "active",
    };
}

function validateQuickDraft(values: PropertyDraftValues): string | null {
    if (!values.basics.propertyType) return "Choose a property type.";
    if (!values.location.locality.trim()) return "Enter the locality.";
    if (!values.area.areaSqft) return "Enter the area.";
    if (values.basics.listingFor === "sell" ? !values.sale.expectedPrice : !values.rent.monthlyRent)
        return "Enter the price.";
    if (!/^[6-9]\d{9}$/.test(values.owner.phone)) return "Enter a valid owner mobile number.";
    if (!values.media.photos.length) return "Add one property photo.";
    return null;
}

