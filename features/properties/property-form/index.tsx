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

import { clientsApi } from "@/lib/api/clients";
import { myListingsApi } from "@/lib/api/my-listings";
import { getStoredUser } from "@/lib/auth/session";
import { buildBasicsSuggestedTitle } from "@/lib/format/property-title";
import { useListingScore } from "@/lib/hooks/use-listing-score";
import { useRouter } from "@/lib/navigation";
import {
    loadPropertyDraft,
    type PendingBuyerAttachment,
    propertyDraftKey,
    removePropertyDraft,
    savePropertyDraft,
    type StoredPropertyDraft,
} from "@/lib/properties/form-draft-storage";
import { isUsablePropertyPhoto, MAX_PROPERTY_PHOTOS } from "@/lib/properties/form-media";
import {
    propertyDraftValidationIssues,
    QUICK_ADD_VALIDATION_FIELDS,
    quickAddValidationIssues,
} from "@/lib/properties/form-validation";
import { BROKER_YOUR_LISTINGS_HREF, brokerPropertyDetailHref } from "@/lib/routes/broker";
import { OWNER_PROPERTIES_HREF, ownerPropertyDetailHref } from "@/lib/routes/owner";
import {
    DEFAULT_PROPERTY_DRAFT,
    fieldRuleSchemas,
    ownerCommissionIssues,
    type PropertyDraftValues,
    STEP_ROOT_FIELDS,
    stepSchemas,
} from "@/lib/schemas/property";
import { cn } from "@/lib/utils";
import {
    isStepVisible as ruleStepIsVisible,
    isVisible as ruleFieldIsVisible,
    stripHidden,
} from "@/lib/visibility/rules";
import { FieldRulesProvider } from "@/lib/visibility/use-field-rules";

import { ArrowRight, Check, ChevronDown, RotateCcw, X } from "@/components/shared/icons";
import { Skeleton } from "@/components/shared/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { FORM_STEPS, PROPERTY_TYPES, type PropertyFormStep, toLabel } from "@/constants/property";
import { SlidingTabs } from "@/features/design-system/theme/sliding-tabs";
import { ListingScoreCard } from "@/features/properties/property-form/listing-score-card";
import { LiveSummaryPanel } from "@/features/properties/property-form/live-summary-panel";
import { PropertyFormSkeleton } from "@/features/properties/property-form/property-form-skeleton";
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
    /** Owner listings are the owner's own. Broker listings can attach a contact owner and buyers. */
    portal?: "broker" | "owner";
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
    portal = "broker",
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
    const [draftSavePending, setDraftSavePending] = useState(false);
    const [formBanner, setFormBanner] = useState<ReactNode>(null);
    const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
    const [mobileScoreOpen, setMobileScoreOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingIntent, setSavingIntent] = useState<"draft" | "publish" | null>(null);
    const [restoringDraft, setRestoringDraft] = useState(true);
    const [storageError, setStorageError] = useState<string | null>(null);
    const [attachmentRetry, setAttachmentRetry] = useState<PendingBuyerAttachment | null>(null);
    const pendingAttachmentRef = useRef<PendingBuyerAttachment | null>(null);
    const photoFilesRef = useRef<Map<string, File>>(new Map());
    const autosaveReadyRef = useRef(false);
    const recoveryRef = useRef<Promise<StoredPropertyDraft | null> | null>(null);
    const persistInFlightRef = useRef(false);
    const pendingFocusPathRef = useRef<string | null>(null);
    const accountId = getStoredUser()?.id ?? "device";
    const localStorageKey = propertyDraftKey(accountId, portal, propertyId);
    const extraStorageKey = propertyDraftKey(accountId, portal, propertyId, "extra");
    // Only a new listing keeps a draft on this device. An edit starts from the
    // saved listing every time, and its changes are kept only by saving.
    const keepsLocalDraft = mode === "create";

    const defaultValues = useMemo(
        () => (initialListing ? listingToDraft(initialListing, portal) : cloneDefaultDraft(portal)),
        [initialListing, portal],
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
        async (nextValues: PropertyDraftValues, ui = draftUiState) => {
            if (!keepsLocalDraft) return;
            await savePropertyDraft(
                localStorageKey,
                {
                    savedAt: new Date().toISOString(),
                    values: nextValues,
                    ui,
                    pendingAttachment: pendingAttachmentRef.current,
                },
                photoFilesRef.current,
            );
        },
        [draftUiState, keepsLocalDraft, localStorageKey],
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
        if (!formIsActive) return;
        let cancelled = false;
        // An edit draft left on this device by an older version is dropped, not restored.
        recoveryRef.current ??= keepsLocalDraft
            ? loadPropertyDraft(localStorageKey, photoFilesRef.current)
            : removePropertyDraft(localStorageKey).then(
                  () => null,
                  () => null,
              );
        void recoveryRef.current
            .then(async (parsed) => {
                if (cancelled) return;
                let base = defaultValues;
                if (mode === "edit") {
                    try {
                        const scoped = await loadPropertyDraft(extraStorageKey, new Map());
                        const legacy = scoped
                            ? null
                            : window.localStorage.getItem(
                                  `property-extra:v${LOCAL_DRAFT_VERSION}:${propertyId}`,
                              );
                        const extras =
                            scoped ??
                            (legacy
                                ? (JSON.parse(legacy) as { values?: Partial<PropertyDraftValues> })
                                : null);
                        if (extras?.values) base = mergeLocalExtras(base, extras.values);
                    } catch {
                        // Use the server values if local-only extras cannot be read.
                    }
                }
                if (cancelled) return;
                methods.reset(parsed?.values ? mergeDraft(base, parsed.values) : base);
                if (parsed?.pendingAttachment) {
                    pendingAttachmentRef.current = parsed.pendingAttachment;
                    setAttachmentRetry(parsed.pendingAttachment);
                }
                if (!parsed?.values) return;
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
                setSavedAt(parsed.savedAt ? new Date(parsed.savedAt) : new Date());
                toast.success("Picked up where you left off.");
            })
            .catch(() => {
                if (!cancelled) setStorageError("Couldn't restore the saved draft on this device.");
            })
            .finally(() => {
                if (!cancelled) {
                    autosaveReadyRef.current = true;
                    setRestoringDraft(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [
        defaultValues,
        extraStorageKey,
        formIsActive,
        keepsLocalDraft,
        localStorageKey,
        methods,
        mode,
        propertyId,
    ]);

    useEffect(() => {
        if (!keepsLocalDraft || !formIsActive || restoringDraft || !autosaveReadyRef.current)
            return;
        setDraftSavePending(true);
        const timer = window.setTimeout(async () => {
            if (!autosaveReadyRef.current) return;
            try {
                await writeLocalDraft(values);
                setSavedAt(new Date());
                setStorageError(null);
            } catch (error) {
                setSavedAt(null);
                setStorageError(
                    error instanceof Error
                        ? error.message
                        : "Couldn't save this draft on your device.",
                );
            } finally {
                setDraftSavePending(false);
            }
        }, 500);
        return () => window.clearTimeout(timer);
    }, [draftUiState, formIsActive, keepsLocalDraft, restoringDraft, values, writeLocalDraft]);

    useEffect(() => {
        if (!formIsActive) return;
        function flushDraft() {
            if (!autosaveReadyRef.current) return;
            void writeLocalDraft(methods.getValues()).catch(() => {});
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
    }, [formIsActive, methods, writeLocalDraft]);

    useEffect(() => {
        const files = photoFilesRef.current;
        return () => {
            for (const url of files.keys()) {
                if (url.startsWith("blob:")) URL.revokeObjectURL(url);
            }
            files.clear();
        };
    }, []);

    useEffect(() => {
        function onKeyDown(event: KeyboardEvent) {
            if (isDialog && !open) return;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                void saveDraftLocally();
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

    // After a step jump (e.g. Publish), focus the first invalid field once it mounts.
    useEffect(() => {
        const path = pendingFocusPathRef.current;
        if (!path) return;
        const frame = requestAnimationFrame(() => {
            if (focusFieldByPath(path)) pendingFocusPathRef.current = null;
        });
        return () => cancelAnimationFrame(frame);
    }, [entryMode, step]);

    async function saveDraftLocally() {
        if (!keepsLocalDraft) return;
        try {
            await writeLocalDraft(methods.getValues());
            setSavedAt(new Date());
            setStorageError(null);
            toast.success("Draft saved on this device.");
        } catch {
            toast.error("Couldn't save the local draft.");
        }
    }

    async function startFreshListing() {
        if (
            methods.formState.isDirty &&
            !window.confirm(
                "Start fresh? This removes the current draft and its photos from this device.",
            )
        )
            return;
        autosaveReadyRef.current = false;
        try {
            await removePropertyDraft(localStorageKey);
        } catch {
            autosaveReadyRef.current = true;
            toast.error("Couldn't remove the saved draft. Please try again.");
            return;
        }
        for (const url of photoFilesRef.current.keys()) {
            if (url.startsWith("blob:")) URL.revokeObjectURL(url);
        }
        photoFilesRef.current.clear();
        methods.reset(defaultValues);
        setStep("basics");
        setHighestUnlocked(mode === "edit" ? FORM_STEPS.length - 1 : 0);
        setCompletedSteps(new Set());
        setEntryMode("full");
        setSavedAt(null);
        setFormBanner(null);
        setStorageError(null);
        autosaveReadyRef.current = true;
        toast.success("Started a fresh listing.");
    }

    function validateStep(target: PropertyFormStep): boolean {
        methods.clearErrors(STEP_ROOT_FIELDS[target] as FieldPath<PropertyDraftValues>[]);
        const current = methods.getValues();
        const result = stepSchemas[target].safeParse(current);
        const ruleResult = fieldRuleSchemas[target].safeParse(current);
        const ownerIssues =
            portal === "owner" && target === "pricing"
                ? ownerCommissionIssues(current).map((issue) => ({
                      path: issue.path.split("."),
                      message: issue.message,
                  }))
                : [];
        if (result.success && ruleResult.success && ownerIssues.length === 0) return true;
        // Owner commission messages are more specific than the generic required ones.
        const ownerPaths = new Set(ownerIssues.map((issue) => issue.path.join(".")));
        const issues = [
            ...ownerIssues,
            ...[
                ...(result.success ? [] : result.error.issues),
                ...(ruleResult.success ? [] : ruleResult.error.issues),
            ].filter((issue) => !ownerPaths.has(issue.path.join("."))),
        ];
        // Only surface errors for fields the user can see on this listing type.
        const visibleIssues = issues.filter((issue) => {
            const path = issue.path.join(".");
            return path.length > 0 && ruleFieldIsVisible(path, current);
        });
        if (visibleIssues.length === 0) return true;

        for (const issue of visibleIssues) {
            const path = issue.path.join(".") as FieldPath<PropertyDraftValues>;
            methods.setError(path, { type: "zod", message: issue.message });
        }

        const firstPath = visibleIssues[0]!.path.join(".");
        pendingFocusPathRef.current = firstPath;
        requestAnimationFrame(() => {
            if (focusFieldByPath(firstPath)) pendingFocusPathRef.current = null;
        });
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
            if (!validateStep(step)) return;
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

    async function saveSilent() {
        if (!keepsLocalDraft) return;
        try {
            await writeLocalDraft(methods.getValues());
            setSavedAt(new Date());
        } catch {
            // Keep navigating even if storage is unavailable.
        }
    }

    async function persistProperty(intent: "draft" | "publish") {
        if (persistInFlightRef.current || restoringDraft || attachmentRetry) return;
        persistInFlightRef.current = true;
        setFormBanner(null);
        const forceDraft = intent === "draft";
        const publishStatus = forceDraft ? "draft" : "active";
        methods.setValue("publish.status", publishStatus, { shouldDirty: true });
        const current: PropertyDraftValues = {
            ...methods.getValues(),
            publish: { ...methods.getValues().publish, status: publishStatus },
        };
        if (current.media.photos.some((photo) => photo.status === "processing")) {
            setFormBanner("Your photos are still being prepared. Please wait before saving.");
            persistInFlightRef.current = false;
            return;
        }
        if (current.media.photos.filter(isUsablePropertyPhoto).length > MAX_PROPERTY_PHOTOS) {
            setEntryMode("full");
            setStep("media");
            setHighestUnlocked(FORM_STEPS.length - 1);
            setFormBanner(
                `Keep up to ${MAX_PROPERTY_PHOTOS} photos before saving. No photos have been removed.`,
            );
            persistInFlightRef.current = false;
            return;
        }
        if (
            mode === "edit" &&
            initialListing &&
            initialListing.society &&
            !current.location.projectOrSociety?.trim()
        ) {
            setEntryMode("full");
            setStep("basics");
            setFormBanner(
                "Removing a saved society is not supported yet. Keep its name, or replace it with the correct name.",
            );
            persistInFlightRef.current = false;
            return;
        }
        if (
            mode === "edit" &&
            initialListing?.exclusiveOwnerId &&
            !current.owner.contactId &&
            portal === "broker"
        ) {
            setEntryMode("full");
            setStep("media");
            setFormBanner(
                "Removing a saved owner is not supported yet. Keep this owner or choose a replacement.",
            );
            persistInFlightRef.current = false;
            return;
        }
        if (forceDraft && entryMode === "full") {
            const issues = propertyDraftValidationIssues(current);
            const first = issues[0];
            if (first) {
                for (const issue of issues)
                    methods.setError(issue.path as FieldPath<PropertyDraftValues>, {
                        type: "draft",
                        message: issue.message,
                    });
                setStep(first.step);
                setHighestUnlocked((value) =>
                    Math.max(
                        value,
                        FORM_STEPS.findIndex((item) => item.id === first.step),
                    ),
                );
                pendingFocusPathRef.current = first.path;
                requestAnimationFrame(() => {
                    if (focusFieldByPath(first.path)) pendingFocusPathRef.current = null;
                });
                persistInFlightRef.current = false;
                return;
            }
        }
        // Quick add checks only its own fields, for both drafts and publishing, and
        // never sends the user to Full details.
        if (entryMode === "quick") {
            if (!validateQuickAdd(methods, current, portal)) {
                persistInFlightRef.current = false;
                return;
            }
        } else if (forceDraft && portal === "owner") {
            // The API requires commission on every owner listing, drafts included.
            const commissionIssues = ownerCommissionIssues(current);
            if (commissionIssues.length > 0) {
                const pricingIndex = FORM_STEPS.findIndex((item) => item.id === "pricing");
                setHighestUnlocked((value) => Math.max(value, pricingIndex));
                setStep("pricing");
                for (const issue of commissionIssues) {
                    methods.setError(issue.path as FieldPath<PropertyDraftValues>, {
                        type: "owner-commission",
                        message: issue.message,
                    });
                }
                pendingFocusPathRef.current = commissionIssues[0]!.path;
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
        if (portal === "owner") {
            current.owner = { ...current.owner, contactId: "" };
            current.attachedBuyers = [];
        }
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
                await attachBuyersAndFinish(updated, current, forceDraft);
                return;
            }
            const created = await myListingsApi.create(input);
            await attachBuyersAndFinish(created, current, forceDraft);
        } catch (error) {
            setFormBanner(
                error instanceof Error
                    ? error.message
                    : "Couldn't save the property. Your changes are still in this form. Please try again.",
            );
        } finally {
            persistInFlightRef.current = false;
            setSaving(false);
            setSavingIntent(null);
        }
    }

    async function attachBuyersAndFinish(
        listing: MyListingItem,
        current: PropertyDraftValues,
        draft: boolean,
    ) {
        const buyerIds =
            portal === "broker"
                ? [...new Set(current.attachedBuyers.map((buyer) => buyer.id))]
                : [];
        if (buyerIds.length) {
            try {
                await clientsApi.setPropertyClients(listing.id, buyerIds);
            } catch {
                const pending = { listing, buyerIds, draft };
                pendingAttachmentRef.current = pending;
                setAttachmentRetry(pending);
                await writeLocalDraft(current).catch(() => {
                    setStorageError(
                        "The property is saved, but the pending buyer links could not be saved on this device. Please retry before leaving.",
                    );
                });
                setFormBanner(
                    "The property was saved, but its buyers could not be attached. Retry below; this will not create another property.",
                );
                return;
            }
        }
        await finishSave(listing, draft);
    }

    async function retryBuyerAttachments() {
        if (!attachmentRetry || persistInFlightRef.current) return;
        persistInFlightRef.current = true;
        setSaving(true);
        try {
            await clientsApi.setPropertyClients(
                attachmentRetry.listing.id,
                attachmentRetry.buyerIds,
            );
            await finishSave(attachmentRetry.listing, attachmentRetry.draft);
            setAttachmentRetry(null);
        } catch {
            setFormBanner(
                "The property is saved. Buyers still could not be attached. Please retry.",
            );
        } finally {
            persistInFlightRef.current = false;
            setSaving(false);
        }
    }

    async function finishSave(listing: MyListingItem, draft: boolean) {
        // Stop autosave so it cannot rewrite the local draft after we clear it.
        autosaveReadyRef.current = false;
        pendingAttachmentRef.current = null;
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
            await savePropertyDraft(
                propertyDraftKey(accountId, portal, listing.id, "extra"),
                {
                    savedAt: new Date().toISOString(),
                    values: stored,
                },
                new Map(),
            );
        } catch {
            toast.error("Property saved, but this device could not keep the device-only details.");
        }
        await removePropertyDraft(localStorageKey).catch(() => {});
        if (mode === "create") {
            methods.reset(cloneDefaultDraft(portal));
            setStep("basics");
            setHighestUnlocked(0);
            setCompletedSteps(new Set());
            setEntryMode("full");
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
        router.push(
            portal === "owner"
                ? ownerPropertyDetailHref(listing.id)
                : brokerPropertyDetailHref(listing.id),
        );
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

    async function requestClose() {
        if (saving || persistInFlightRef.current) return;
        if (attachmentRetry) {
            toast.error("Please retry attaching buyers before closing this form.");
            return;
        }
        let locallySaved = false;
        if (keepsLocalDraft && autosaveReadyRef.current) {
            try {
                await writeLocalDraft(methods.getValues());
                setSavedAt(new Date());
                locallySaved = true;
            } catch {
                // Still allow closing if storage is unavailable.
            }
        }
        if (
            methods.formState.isDirty &&
            !window.confirm(
                !keepsLocalDraft
                    ? "Close without saving? Your changes to this property will be lost."
                    : locallySaved
                      ? "Close this form? Your latest changes and photos are saved on this device."
                      : "This device could not save your latest changes. Close and lose those changes?",
            )
        )
            return;
        onOpenChange?.(false);
        onCancel?.();
        if (!isDialog && !onCancel)
            router.push(portal === "owner" ? OWNER_PROPERTIES_HREF : BROKER_YOUR_LISTINGS_HREF);
    }

    const formActions = (
        <PropertyFormActions
            entryMode={entryMode}
            stepIndex={stepIndex}
            stepCount={activeSteps.length}
            isLastStep={isLastStep}
            isSubmitting={saving}
            showStartFresh={mode === "create"}
            onStartFresh={() => void startFreshListing()}
            onBack={goBack}
            onSaveDraft={() => void persistProperty("draft")}
            onNext={() => {
                if (entryMode === "quick") void persistProperty("draft");
                else if (isLastStep) void persistProperty("publish");
                else goNext();
            }}
        />
    );

    const surface = (
        <FormProvider {...methods}>
            <FieldRulesProvider>
                <form
                    onSubmit={handleFormSubmit}
                    onKeyDown={handleFormKeyDown}
                    noValidate
                    aria-busy={restoringDraft || undefined}
                    className={cn(
                        `relative flex flex-1 flex-col overflow-hidden bg-surface min-block-0`,
                        className,
                    )}
                >
                    <fieldset
                        disabled={restoringDraft || saving || attachmentRetry != null}
                        className="contents"
                    >
                        <PropertyFormHeader
                            mode={mode}
                            entryMode={entryMode}
                            onEntryModeChange={setEntryMode}
                            isSaved={Boolean(savedAt) && !draftSavePending && !storageError}
                            savingIntent={savingIntent}
                            onSaveDraft={() => {
                                void persistProperty("draft");
                            }}
                            onPublish={() => {
                                void persistProperty("publish");
                            }}
                            onClose={() => {
                                void requestClose();
                            }}
                            showClose={isDialog}
                            restoring={restoringDraft}
                        />
                        {restoringDraft ? (
                            <PropertyFormSkeleton />
                        ) : entryMode === "full" ? (
                            <>
                                {storageError ? (
                                    <p role="alert" className="px-4 py-2 text-sm text-danger">
                                        {storageError}
                                    </p>
                                ) : null}
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
                                      grid flex-1 gap-4 bg-surface-muted p-4 min-block-0
                                      xl:grid-cols-[256px_minmax(0,1fr)_320px]
                                    "
                                >
                                    <aside
                                        className="
                                          hidden flex-col rounded-card bg-surface px-4 py-5
                                          shadow-sm min-block-0
                                          xl:flex
                                        "
                                    >
                                        <StepNav
                                            steps={activeSteps}
                                            activeStep={step}
                                            highestUnlocked={highestUnlocked}
                                            completedSteps={completedSteps}
                                            onStepChange={changeStep}
                                        />
                                        <div className="shrink-0 border-bs border-border-warm pbs-5">
                                            {formActions}
                                        </div>
                                    </aside>
                                    <main
                                        className="
                                          overflow-y-auto bg-surface-muted min-block-0 min-inline-0
                                        "
                                    >
                                        <div
                                            className="
                                              rounded-card border border-border-warm bg-surface p-5
                                              shadow-sm min-block-full
                                              sm:p-6
                                              xl:p-7
                                            "
                                        >
                                            <div className="-m-1 p-1 pbe-2">
                                                <h1 className="sr-only">
                                                    {activeSteps[stepIndex]?.label}
                                                </h1>
                                                {formBanner ? (
                                                    <div
                                                        role="alert"
                                                        className="
                                                          mbe-5 rounded-control border
                                                          border-danger/30 bg-danger-soft px-4 py-3
                                                          text-sm font-medium text-danger
                                                        "
                                                    >
                                                        {formBanner}
                                                    </div>
                                                ) : null}
                                                <StepTransition step={step}>
                                                    <StepContent
                                                        propertyId={propertyId}
                                                        step={step}
                                                        portal={portal}
                                                        photoFilesRef={photoFilesRef}
                                                    />
                                                </StepTransition>
                                            </div>
                                            <div
                                                className="
                                                  mbs-6 border-bs border-border-warm pbs-5
                                                  xl:hidden
                                                "
                                            >
                                                {formActions}
                                            </div>
                                        </div>
                                    </main>
                                    <aside
                                        className="
                                          hidden overflow-y-auto bg-surface-muted min-block-0
                                          min-inline-0
                                          xl:block
                                        "
                                    >
                                        <div className="flex flex-col gap-4">
                                            <LiveSummaryPanel
                                                audience={portal}
                                                values={values}
                                                stepIndex={stepIndex}
                                                photoFilesRef={photoFilesRef}
                                                onGoToMedia={() => {
                                                    setHighestUnlocked(FORM_STEPS.length - 1);
                                                    setStep("media");
                                                }}
                                            />
                                            <ListingScoreCard
                                                score={listingScore.score}
                                                tips={listingScore.tips}
                                                onTip={(tipStep) => {
                                                    setHighestUnlocked(FORM_STEPS.length - 1);
                                                    setStep(tipStep);
                                                }}
                                            />
                                        </div>
                                    </aside>
                                </div>
                                <MobileDealSummary
                                    audience={portal}
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
                                  flex flex-1 flex-col overflow-y-auto bg-surface-muted p-4
                                  min-block-0 min-inline-0
                                "
                            >
                                {storageError ? (
                                    <p role="alert" className="mbe-4 text-sm text-danger">
                                        {storageError}
                                    </p>
                                ) : null}
                                <div
                                    className="
                                      flex flex-1 flex-col rounded-card border border-border-warm
                                      bg-surface p-5 shadow-sm
                                      sm:p-6 sm:py-7
                                      xl:p-8
                                    "
                                >
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
                                    <QuickAdd photoFilesRef={photoFilesRef} portal={portal} />
                                    <div className="mbs-6 border-bs border-border-warm pbs-5">
                                        {formActions}
                                    </div>
                                </div>
                            </main>
                        )}
                    </fieldset>
                    {attachmentRetry ? (
                        <div
                            role="alert"
                            className="
                              flex flex-wrap items-center gap-3 border-bs border-border-warm px-4
                              py-3
                            "
                        >
                            <p className="flex-1 text-sm text-danger">
                                Property saved. Buyer attachment is pending.
                            </p>
                            <Button
                                type="button"
                                onClick={() => {
                                    void retryBuyerAttachments();
                                }}
                                loading={saving}
                            >
                                Retry attaching buyers
                            </Button>
                        </div>
                    ) : null}
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
                if (!next) void requestClose();
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
    restoring,
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
    restoring: boolean;
}) {
    const title = mode === "edit" ? "Edit property" : "Add property";
    const isBusy = savingIntent != null;
    // Edits are not kept on the device, so only a new listing shows the draft badge.
    const savedHint =
        mode === "edit" ? null : (
            <div className="flex items-center min-block-5 min-inline-34">
                {restoring ? (
                    <Skeleton className="rounded-full block-5 inline-full" />
                ) : (
                    <Popover>
                        <PopoverTrigger
                            type="button"
                            className="
                              inline-flex items-center justify-center rounded-full
                              focus-visible:outline-2 focus-visible:outline-offset-4
                              focus-visible:outline-brand
                            "
                            aria-label="About details saved on this device"
                        >
                            <Badge color={isSaved ? "emerald" : "amber"} aria-live="polite">
                                {isSaved ? "Saved on this device" : "Not saved yet"}
                            </Badge>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="text-sm text-ink max-inline-xs">
                            Changes you have not saved yet are kept as a draft on this device.
                            Saving the property sends every detail to your account.
                        </PopoverContent>
                    </Popover>
                )}
            </div>
        );

    return (
        <header
            className="
              flex shrink-0 flex-wrap items-center justify-between gap-3 border-be
              border-border-warm bg-surface px-4 py-3 shadow-xs
              sm:flex-nowrap sm:px-6
            "
        >
            {showClose ? (
                <DialogHeader
                    className="
                      flex flex-1 flex-row flex-wrap items-center! gap-2.5 pe-0 text-start
                      min-inline-0
                    "
                >
                    <DialogTitle className="text-2xl font-bold min-inline-0">
                        {title}. <span className="text-ink-muted">Add the property details.</span>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Property and commission details. Full details walks through every step;
                        Quick add saves the essentials as a draft.
                    </DialogDescription>
                    {savedHint}
                </DialogHeader>
            ) : (
                <div className="flex flex-1 flex-wrap items-center gap-2.5 min-inline-0">
                    <h1 className="font-display text-2xl font-bold text-ink min-inline-0">
                        {title}. <span className="text-ink-muted">Add the property details.</span>
                    </h1>
                    {savedHint}
                </div>
            )}
            <TooltipProvider>
                <div
                    className="
                      flex shrink-0 items-center justify-end gap-2 inline-full
                      sm:inline-auto
                    "
                >
                    <SlidingTabs
                        value={entryMode}
                        onValueChange={onEntryModeChange}
                        ariaLabel="Entry mode"
                        options={ENTRY_MODE_TABS}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="md"
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
                        size="md"
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
                                                size="icon-md"
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

function PropertyFormActions({
    entryMode,
    stepIndex,
    stepCount,
    isLastStep,
    isSubmitting,
    showStartFresh,
    onStartFresh,
    onBack,
    onSaveDraft,
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
    onSaveDraft: () => void;
    onNext: () => void;
}) {
    const showBack = entryMode === "full" && stepIndex > 0;
    const showPrimary = true;
    const progressPct = stepCount ? Math.round(((stepIndex + 1) / stepCount) * 100) : 0;
    const primaryLabel =
        entryMode === "quick" ? "Save as draft" : isLastStep ? "Publish" : "Continue";

    return (
        <div className="flex flex-col gap-4 pbe-[env(safe-area-inset-bottom)] text-center">
            <div className="flex flex-col gap-4 min-inline-0">
                {showStartFresh ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={onStartFresh}
                        aria-label="Start fresh"
                        className="order-last text-ink-muted inline-full"
                    >
                        <RotateCcw aria-hidden />
                        <span>Start fresh</span>
                    </Button>
                ) : null}
                {entryMode === "full" ? (
                    <div className="flex flex-col gap-3 min-inline-0">
                        <Progress
                            value={progressPct}
                            className="
                              flex-col items-stretch gap-2 inline-full
                              **:data-[slot=progress-indicator]:bg-brand
                              **:data-[slot=progress-track]:bg-surface-muted
                              **:data-[slot=progress-track]:block-1.5
                              **:data-[slot=progress-track]:inline-full
                            "
                        >
                            <ProgressLabel className="body-xs tabular font-medium text-ink-muted">
                                Step {stepIndex + 1} of {stepCount}
                            </ProgressLabel>
                        </Progress>
                        <p
                            className="
                              body-xs hidden flex-wrap items-center justify-center gap-1.5
                              text-ink-muted
                              xl:flex
                            "
                        >
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
            <div className="flex flex-col gap-2">
                {entryMode === "full" ? (
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={onSaveDraft}
                        className="inline-full sm:hidden"
                    >
                        Save draft
                    </Button>
                ) : null}
                {showBack ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onBack}
                        className="order-2 inline-full"
                    >
                        Back
                    </Button>
                ) : null}
                {showPrimary ? (
                    <Button
                        type="button"
                        variant="accent"
                        size="md"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        onClick={onNext}
                        className="inline-full"
                    >
                        {primaryLabel}
                        {entryMode === "quick" || isLastStep ? (
                            <Check aria-hidden />
                        ) : (
                            <ArrowRight aria-hidden />
                        )}
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

function StepContent({
    propertyId,
    step,
    portal,
    photoFilesRef,
}: {
    propertyId?: string;
    step: PropertyFormStep;
    portal: "broker" | "owner";
    photoFilesRef: MutableRefObject<Map<string, File>>;
}) {
    if (step === "basics") {
        return (
            <div
                className="
                  flex flex-col divide-y divide-border-warm
                  [&>*+*]:pbs-6
                  [&>*:not(:last-child)]:pbe-6
                "
            >
                <StepBasics />
                <StepLocation />
            </div>
        );
    }
    if (step === "details") {
        return (
            <div
                className="
                  flex flex-col divide-y divide-border-warm
                  [&>*+*]:pbs-6
                  [&>*:not(:last-child)]:pbe-6
                "
            >
                <StepDetails />
                <StepArea />
            </div>
        );
    }
    if (step === "pricing") {
        return (
            <div
                className="
                  flex flex-col divide-y divide-border-warm
                  [&>*+*]:pbs-6
                  [&>*:not(:last-child)]:pbe-6
                "
            >
                <StepPricing />
                <StepCommission portal={portal} />
            </div>
        );
    }
    if (step === "furnishing") {
        return <StepFurnishing />;
    }
    return (
        <div
            className="
              flex flex-col divide-y divide-border-warm
              [&>*+*]:pbs-6
              [&>*:not(:last-child)]:pbe-6
            "
        >
            <StepMedia photoFilesRef={photoFilesRef} />
            {portal === "broker" ? <StepPublish propertyId={propertyId} /> : null}
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
        <div className="border-bs border-border-warm bg-surface xl:hidden">
            <Button
                type="button"
                variant="ghost"
                aria-expanded={open}
                aria-controls="mobile-listing-score-panel"
                onClick={() => onOpenChange(!open)}
                className="
                  flex items-center justify-between gap-3 px-4 text-start text-ink inline-full
                  min-block-11
                  hover:bg-brand-soft/50
                  focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:ring-inset
                "
            >
                <span className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <span
                        className="
                          tabular flex items-center justify-center rounded-full bg-brand
                          text-surface block-7 inline-7
                        "
                    >
                        {score}%
                    </span>
                    Listing score
                </span>
                <span className="flex items-center gap-2 text-xs text-ink-muted min-inline-0">
                    <span className="hidden truncate sm:block">
                        {tips[0]?.label ?? "Score complete"}
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
                        <ListingScoreCard
                            score={score}
                            tips={tips}
                            onTip={onTip}
                            className="p-0 shadow-none"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function MobileDealSummary({
    audience,
    values,
    stepIndex,
    photoFilesRef,
    open,
    onOpenChange,
}: {
    audience: "owner" | "broker";
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
                  flex items-center justify-between gap-4 bg-brand px-4 text-start inline-full
                  min-block-14
                  focus-visible:ring-2 focus-visible:ring-brand-soft focus-visible:ring-inset
                "
            >
                <div className="flex-1 min-inline-0">
                    <LiveSummaryPanel
                        audience={audience}
                        values={values}
                        stepIndex={stepIndex}
                        compact
                    />
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
                      bg-surface-muted shadow-xl max-block-[72dvh]
                    "
                    data-open={open}
                >
                    <div className="mx-auto p-4 max-inline-md">
                        <LiveSummaryPanel
                            audience={audience}
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

function cloneDefaultDraft(portal: "broker" | "owner" = "broker"): PropertyDraftValues {
    const draft = JSON.parse(JSON.stringify(DEFAULT_PROPERTY_DRAFT)) as PropertyDraftValues;
    // A listing is always offered in the holder's country. The Surat / Gujarat
    // starting place only makes sense for the launch market.
    const marketName = getStoredUser()?.country?.name;
    if (marketName && marketName !== draft.location.country) {
        draft.location.country = marketName;
        draft.location.state = "";
        draft.location.city = "";
    }
    // Owners must type the commission themselves; no pre-filled rate.
    if (portal === "owner") {
        draft.commission.sale.value = null;
        draft.commission.rent.value = null;
    }
    return draft;
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
    merged.media.photos = (merged.media.photos ?? []).filter((photo) => Boolean(photo.url));
    merged.attachedBuyers = Array.isArray(merged.attachedBuyers) ? merged.attachedBuyers : [];
    if (!merged.owner.contactId) merged.owner.contactId = "";
    // Legacy drafts may still store removed commission pickers ("months", etc.).
    merged.commission.sale.mode = "percent";
    merged.commission.sale.paidBy = "owner";
    merged.commission.rent.mode = "flat";
    merged.commission.rent.paidBy = "owner";
    return merged;
}

/** Local-only extras must never overwrite newer server prices, photos or contacts. */
function mergeLocalExtras(
    base: PropertyDraftValues,
    saved: Partial<PropertyDraftValues>,
): PropertyDraftValues {
    const next = structuredClone(base);
    next.location.fullAddress = saved.location?.fullAddress ?? next.location.fullAddress;
    // These are saved on the server now. A value kept only on this device by an
    // older version fills a blank server value, and goes up on the next save.
    next.location.unitNumber = next.location.unitNumber || saved.location?.unitNumber || "";
    next.area.carpetArea = next.area.carpetArea ?? saved.area?.carpetArea ?? null;
    next.details.propertyAge = next.details.propertyAge ?? saved.details?.propertyAge ?? null;
    next.details.propertyCondition =
        next.details.propertyCondition || saved.details?.propertyCondition || "";
    return next;
}

function draftForStorage(values: PropertyDraftValues): PropertyDraftValues {
    const safe = JSON.parse(JSON.stringify(values)) as PropertyDraftValues;
    safe.media.photos = safe.media.photos.filter(
        (photo) => Boolean(photo.url) && !photo.url.startsWith("blob:"),
    );
    return safe;
}

function listingToDraft(
    listing: MyListingItem,
    portal: "broker" | "owner" = "broker",
): PropertyDraftValues {
    const draft = cloneDefaultDraft(portal);
    draft.basics.listingFor =
        listing.transactionType === "sale"
            ? "sell"
            : listing.transactionType === "both"
              ? "both"
              : "rent";
    draft.basics.category = listing.category;
    draft.basics.propertyType = legacyPropertyTypeToDraft(listing.propertyType);
    const savedType = listing.subtype ? apiSubtypeToDraft(listing.subtype) : "";
    if (savedType) {
        // Older agricultural listings were saved as `land`; recover it from the subtype.
        const inCategory = (category: keyof typeof PROPERTY_TYPES) =>
            (PROPERTY_TYPES[category] as readonly string[]).includes(savedType);
        if (!inCategory(draft.basics.category) && inCategory("agricultural")) {
            draft.basics.category = "agricultural";
        }
        if (inCategory(draft.basics.category)) draft.basics.propertyType = savedType;
    }
    draft.basics.title = listing.title;
    draft.basics.description = listing.description;
    draft.location.city = listing.city;
    draft.location.country = listing.country || draft.location.country;
    draft.location.state = listing.state || draft.location.state;
    draft.location.locality = listing.locality;
    draft.location.unitNumber = listing.unitNumber || "";
    draft.location.streetOrRoad = listing.streetOrRoad || "";
    draft.location.landmark = listing.landmark || listing.address || listing.locality;
    draft.location.pincode = listing.pinCode;
    draft.location.projectOrSociety = listing.society || "";
    draft.details.bedrooms = String(listing.bhk || 2);
    draft.details.bathrooms = listing.bathrooms;
    draft.details.balconies = listing.balconies;
    draft.details.floorNumber = listing.floorNumber ?? null;
    draft.details.totalFloors = listing.totalFloors;
    draft.details.propertyAge = listing.propertyAge == null ? null : Number(listing.propertyAge);
    draft.details.propertyCondition = listing.propertyCondition || "";
    draft.details.facing = listing.facing ?? "";
    draft.details.coveredParking =
        listing.parking === "none" ? 0 : listing.parking === "3plus" ? 3 : Number(listing.parking);
    draft.area.carpetArea = listing.carpetAreaSqft ?? null;
    draft.area.plotArea = listing.areaSqft || null;
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
    draft.commission.rent.value = listing.commissionAmount ?? (portal === "owner" ? null : 0);
    draft.rent.availableFrom = listing.availableFrom?.slice(0, 10) ?? "";
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
    if (portal === "broker") {
        draft.owner.contactId = listing.exclusiveOwnerId || "";
        draft.owner.name = listing.ownerName || "";
        draft.owner.phone = listing.ownerPhoneDigits || "";
    }
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

/** Form type ↔ API `subtype`. Only `1rk` (invalid enum name) and legacy `flat` differ. */
function draftTypeToApiSubtype(value: string): string | undefined {
    if (!value) return undefined;
    return value === "1rk" ? "one_rk" : value;
}

function apiSubtypeToDraft(value: string): string {
    if (value === "one_rk") return "1rk";
    if (value === "flat") return "apartment";
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
    const usablePhotos = values.media.photos.filter(isUsablePropertyPhoto);
    const imageSrcs = usablePhotos.map((photo) => photo.url);
    const photoFiles = usablePhotos
        .map((photo) => photoFilesRef.current.get(photo.url) ?? photoFilesRef.current.get(photo.id))
        .filter((file): file is File => Boolean(file));
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
        category: values.basics.category,
        propertyType,
        subtype: draftTypeToApiSubtype(values.basics.propertyType),
        bhk,
        title: values.basics.title.trim() || generatedTitle,
        locality: values.location.locality,
        city: values.location.city,
        address: values.location.streetOrRoad || values.location.fullAddress,
        pinCode: values.location.pincode,
        landmark: values.location.landmark,
        // stripHidden drops projectOrSociety for non-gated plots.
        society: values.location.projectOrSociety ?? "",
        unitNumber: values.location.unitNumber ?? "",
        carpetAreaSqft: values.area.carpetArea ?? null,
        propertyAge: values.details.propertyAge ?? null,
        propertyCondition: values.details.propertyCondition ?? "",
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

/** Scroll to and focus a form control by its draft path (e.g. `rent.availableFrom`). */
function focusFieldByPath(path: string): boolean {
    const id = path.replace(/\./g, "-");
    const byId = document.getElementById(id);
    const byName = document.querySelector<HTMLElement>(`[name="${CSS.escape(path)}"]`);
    const byLabel = document.querySelector<HTMLElement>(`[aria-labelledby="${id}-label"]`);
    const root = byId ?? byName ?? byLabel;
    if (!root) return false;

    // Reveal collapsed sections before scrolling to a validation error.
    let section = root.closest("details");
    while (section) {
        section.open = true;
        section = section.parentElement?.closest("details") ?? null;
    }
    root.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = root.matches("input, select, textarea, button, [tabindex]")
        ? root
        : root.querySelector<HTMLElement>("input, select, textarea, button, [tabindex]");
    focusable?.focus({ preventScroll: true });
    return true;
}

/**
 * Not a real form field — the draft schema raises the missing-cover error at
 * `media.cover` (photos live in `media.photos`), so the path needs a cast.
 */
const MEDIA_COVER_ERROR_PATH = "media.cover" as FieldPath<PropertyDraftValues>;

const QUICK_ADD_ERROR_FIELDS = [
    ...QUICK_ADD_VALIDATION_FIELDS,
] as readonly FieldPath<PropertyDraftValues>[];

/** Field-level validation for Quick add — same inline errors as Full details. */
function validateQuickAdd(
    methods: ReturnType<typeof useForm<PropertyDraftValues>>,
    values: PropertyDraftValues,
    portal: "broker" | "owner",
): boolean {
    methods.clearErrors([...QUICK_ADD_ERROR_FIELDS]);
    const issues = quickAddValidationIssues(values, portal);

    if (!issues.length) return true;

    for (const issue of issues) {
        methods.setError(issue.path as FieldPath<PropertyDraftValues>, {
            type: "quick",
            message: issue.message,
        });
    }
    const firstPath = issues[0]!.path;
    requestAnimationFrame(() => {
        focusFieldByPath(firstPath);
        if (firstPath === MEDIA_COVER_ERROR_PATH) {
            document.getElementById("quick-cover-upload")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    });
    return false;
}
