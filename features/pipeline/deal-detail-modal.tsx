"use client";

import { type ReactNode, useId, useRef, useState } from "react";

import { formatDateIn, formatDateShort, formatTimeIn } from "@/lib/format/date";
import { formatTelUrl } from "@/lib/format/phone";
import { formatPrice, formatRent } from "@/lib/format/price";
import { brokerPropertyDetailHref } from "@/lib/routes/broker";
import { cn } from "@/lib/utils";
import { MAX_CHARS } from "@/lib/validation/text-limits";

import { EmptyState } from "@/components/empty-state";
import { AppModal } from "@/components/shared/app-modal";
import { AppModalFooter } from "@/components/shared/app-modal-footer";
import { CharacterCount } from "@/components/shared/character-count";
import { ContactName } from "@/components/shared/contact-name";
import { IconButton } from "@/components/shared/icon-button";
import {
    type AppIcon,
    ArrowRight,
    BadgeCheck,
    Briefcase,
    CalendarCheck,
    CallIcon,
    Check,
    CircleX,
    ExternalLink,
    HandCoins,
    MapPin,
    Pencil,
    Plus,
    RefreshCw,
    StickyNote,
    Wallet,
    X,
} from "@/components/shared/icons";
import { PhoneNumber } from "@/components/shared/phone-number";
import { PriceWithCommission } from "@/components/shared/price-with-commission";
import { PropertyPhotoGallery } from "@/components/shared/property-photo-gallery";
import { Skeleton } from "@/components/shared/skeleton";
import { UserAvatar } from "@/components/shared/user-avatar";
import { WorkflowLink as Link } from "@/components/shared/workflow-link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { FEATURE_PLATFORM_OWNER } from "@/config";
import { PipelineDetailSkeleton } from "@/features/pipeline/pipeline-skeleton";
import {
    describeStageHistory,
    type StageHistoryRow,
    stageTitle,
} from "@/features/pipeline/stage-history";
import {
    DEAL_OUTCOME_META,
    DEAL_STAGE_META,
    lostReasonLabel,
    OFFER_STATUS_LABEL,
} from "@/features/pipeline/stage-meta";
import type { DealDetail, DealHistoryEntry, DealStatus } from "@/features/pipeline/types";
import { isLiveStage, nextStage } from "@/features/pipeline/types";

import styles from "./deal-detail-modal.module.css";

function formatMoney(amountInr: number | null, isRent: boolean): string {
    if (amountInr == null || amountInr <= 0) return "Not recorded";
    return isRent ? formatRent(amountInr) : formatPrice(amountInr);
}

function formatWhen(iso: string | null): string {
    if (!iso) return "Date not added";
    const date = new Date(iso);
    if (!Number.isFinite(date.getTime())) return "Date unavailable";
    return `${formatDateIn(date)} at ${formatTimeIn(date)}`;
}

function historyIcon(row: StageHistoryRow): AppIcon {
    if (row.kind === "call") return CallIcon;
    if (row.kind === "note") return StickyNote;
    const { status } = row;
    if (status === "new") return Plus;
    if (status === "closed_won" || status === "closed") return BadgeCheck;
    if (status === "closed_lost" || status === "lost" || status === "offer_rejected")
        return CircleX;
    if (status === "site_visit" || status === "visit") return CalendarCheck;
    if (status === "offer_made" || status === "negotiation") return HandCoins;
    return ArrowRight;
}

function HistoryList({ history, isRent }: { history: DealHistoryEntry[]; isRent: boolean }) {
    const [expanded, setExpanded] = useState(false);
    if (!history.length) return <p className="body-sm text-ink-muted">No activity recorded yet.</p>;
    const all = describeStageHistory(history, { isRent });
    const ordered = expanded ? all : all.slice(0, 3);
    return (
        <>
            <ol className={styles.timeline} aria-label="Deal activity, newest first">
                {ordered.map((entry, index) => {
                    const Icon = historyIcon(entry);
                    const date = entry.at ? new Date(entry.at) : null;
                    const validDate = date && Number.isFinite(date.getTime()) ? date : null;
                    return (
                        <li
                            key={`${entry.at}-${entry.status}-${index}`}
                            className={styles.timelineEntry}
                            data-latest={index === 0}
                        >
                            <span className={styles.timelineIcon} aria-hidden>
                                <Icon size={16} strokeWidth={1.7} />
                            </span>
                            <div className={styles.timelineContent}>
                                <div className={styles.timelineTitleRow}>
                                    <h3 className={styles.timelineTitle}>{entry.title}</h3>
                                </div>
                                {validDate ? (
                                    <time
                                        className={styles.timelineDate}
                                        dateTime={validDate.toISOString()}
                                        title={`${formatDateIn(validDate)}, ${formatTimeIn(validDate)}`}
                                    >
                                        {formatDateShort(validDate)} at {formatTimeIn(validDate)}
                                    </time>
                                ) : null}
                                {entry.note ? (
                                    <p className={styles.timelineNote}>{entry.note}</p>
                                ) : null}
                                {entry.actor ? (
                                    <p className={styles.timelineActor}>
                                        By <span>{entry.actor}</span>
                                    </p>
                                ) : null}
                            </div>
                        </li>
                    );
                })}
            </ol>
            {all.length > 3 ? (
                <button
                    type="button"
                    className={styles.textAction}
                    aria-expanded={expanded}
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? "Show latest 3 updates" : `View all ${all.length} updates`}
                </button>
            ) : null}
        </>
    );
}

function DealNotes({
    note,
    onSave,
    isBusy,
}: {
    note: string;
    onSave?: (note: string) => Promise<void>;
    isBusy: boolean;
}) {
    const id = useId();
    const fieldRef = useRef<HTMLTextAreaElement>(null);
    const [draft, setDraft] = useState(note);
    const [sourceNote, setSourceNote] = useState(note);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    if (sourceNote !== note) {
        setSourceNote(note);
        if (!editing) setDraft(note);
    }

    async function save() {
        if (!onSave || saving) return;
        if (draft === note) {
            setEditing(false);
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await onSave(draft);
            setEditing(false);
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Could not save your notes. Your text is still here. Try again.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <section className={styles.notes} aria-label="Deal notes">
            <label htmlFor={id} className={styles.sectionTitle}>
                Notes
            </label>
            <div className={styles.noteEditor}>
                <Textarea
                    ref={fieldRef}
                    id={id}
                    rows={4}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    readOnly={!editing}
                    disabled={saving}
                    maxLength={MAX_CHARS.dealNote}
                    placeholder="Add notes about this deal"
                    className={styles.noteTextarea}
                    aria-describedby={error ? `${id}-error` : undefined}
                    aria-invalid={Boolean(error)}
                />
                {onSave ? (
                    <div className={styles.noteControls}>
                        {editing ? (
                            <>
                                <IconButton
                                    size="md"
                                    aria-label="Cancel note changes"
                                    title="Cancel changes"
                                    disabled={saving}
                                    onClick={() => {
                                        setDraft(note);
                                        setEditing(false);
                                        setError(null);
                                    }}
                                >
                                    <X aria-hidden size={16} />
                                </IconButton>
                                <IconButton
                                    size="md"
                                    tone="brand"
                                    aria-label="Save notes"
                                    title="Save notes"
                                    loading={saving}
                                    disabled={isBusy && !saving}
                                    onClick={() => void save()}
                                >
                                    <Check aria-hidden size={16} />
                                </IconButton>
                            </>
                        ) : (
                            <IconButton
                                size="md"
                                tone="brand"
                                aria-label="Edit notes"
                                title="Edit notes"
                                disabled={isBusy}
                                onClick={() => {
                                    setEditing(true);
                                    requestAnimationFrame(() => fieldRef.current?.focus());
                                }}
                            >
                                <Pencil aria-hidden size={16} />
                            </IconButton>
                        )}
                    </div>
                ) : null}
            </div>
            {editing ? <CharacterCount value={draft} maxChars={MAX_CHARS.dealNote} /> : null}
            {error ? (
                <p id={`${id}-error`} role="alert" className="body-sm text-danger">
                    {error}
                </p>
            ) : null}
        </section>
    );
}

function DealPerson({
    role,
    person,
    phone,
    phoneMessage,
}: {
    role: "Client" | "Owner";
    person: { id?: string; name: string; avatarUrl?: string };
    phone?: string;
    phoneMessage?: string;
}) {
    return (
        <div className={styles.person}>
            <UserAvatar name={person.name} imageUrl={person.avatarUrl} size="xs" />
            <div className={styles.personDetails}>
                <span className="body-xs text-ink-muted">{role}</span>
                <ContactName
                    name={person.name}
                    contactId={person.id}
                    contactType={role === "Client" ? "buyer" : "owner"}
                    className="body-sm font-medium wrap-anywhere"
                />
                {phone ? (
                    <PhoneNumber
                        phoneDigits={phone}
                        className="body-xs font-semibold text-ink-muted"
                    />
                ) : (
                    <span className="body-xs font-semibold text-ink-muted">
                        {phoneMessage ?? "Phone number not added"}
                    </span>
                )}
            </div>
            {phone ? (
                <IconButton
                    size="md"
                    nativeButton={false}
                    aria-label={`Call ${role.toLowerCase()} ${person.name}`}
                    render={<a href={formatTelUrl(phone)} />}
                >
                    <CallIcon aria-hidden size={17} />
                </IconButton>
            ) : null}
        </div>
    );
}

function DetailField({
    label,
    children,
    icon: Icon,
}: {
    label: string;
    children: ReactNode;
    icon?: AppIcon;
}) {
    return (
        <div className={styles.dealFact}>
            {Icon ? (
                <Icon className={styles.dealFactIcon} size={20} strokeWidth={1.6} aria-hidden />
            ) : null}
            <div className={styles.dealFactContent}>
                <p className="body-xs font-semibold text-ink-muted">{label}</p>
                <div className="body-sm font-medium text-ink">{children}</div>
            </div>
        </div>
    );
}

/**
 * Full lead sheet: parties, money, notes, and stage history.
 * Opened from the View button on a pipeline card.
 */
export function DealDetailModal({
    open,
    deal: detail,
    isLoading,
    error,
    onClose,
    onStageAction,
    onRetry,
    isBusy,
    onSaveNote,
    onMakeOffer,
}: {
    open: boolean;
    deal: DealDetail | null;
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
    onStageAction: (status: DealStatus) => void;
    onRetry: () => void;
    isBusy: boolean;
    onSaveNote?: (note: string) => Promise<void>;
    onMakeOffer?: () => void;
}) {
    const deal = detail;
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const next = deal && isLiveStage(deal.status) ? nextStage(deal.status) : null;
    const target: DealStatus | null = next ?? (deal?.status === "negotiation" ? "closed" : null);
    const actionLabel =
        target === "contacted"
            ? "Mark contacted"
            : target === "visit"
              ? "Move to site visit"
              : target === "negotiation"
                ? "Start negotiating"
                : "Mark as sold";
    const ActionIcon = target && isLiveStage(target) ? DEAL_STAGE_META[target].icon : BadgeCheck;
    const title = deal ? `Deal with ${deal.buyer.name}` : "Deal details";
    const location = deal
        ? [...new Set([deal.property.locality, deal.property.city].filter(Boolean))].join(", ")
        : "";

    const statusLabel = deal
        ? detail?.apiStage
            ? stageTitle(detail.apiStage)
            : isLiveStage(deal.status)
              ? DEAL_STAGE_META[deal.status].label
              : DEAL_OUTCOME_META[deal.status].label
        : null;

    return (
        <AppModal
            open={open}
            modal={!lightboxOpen}
            onOpenChange={(next) => {
                if (!next && !lightboxOpen) onClose();
            }}
            size="xl"
            padding="md"
            nativeScroll
            footer={
                isLoading ? (
                    <AppModalFooter className={styles.footer} aria-hidden>
                        <Skeleton className="block-8 inline-28" />
                        <Skeleton className="block-8 inline-36" />
                    </AppModalFooter>
                ) : deal ? (
                    <AppModalFooter className={styles.footer}>
                        <Button
                            variant="link"
                            size="sm"
                            className={cn(styles.propertyLink, "font-medium")}
                            nativeButton={false}
                            render={<Link href={brokerPropertyDetailHref(deal.property.id)} />}
                        >
                            View full property <ExternalLink size={16} aria-hidden />
                        </Button>
                        {onMakeOffer && isLiveStage(deal.status) && !deal.property.isSold ? (
                            <Button
                                size="default"
                                variant="outline"
                                className="font-medium"
                                disabled={isBusy}
                                onClick={onMakeOffer}
                            >
                                <HandCoins aria-hidden size={16} />
                                {deal.offerAmountInr != null ? "Update offer" : "Record offer"}
                            </Button>
                        ) : null}
                        {target ? (
                            <Button
                                size="default"
                                variant="accent"
                                className="font-medium"
                                disabled={isBusy || isLoading}
                                onClick={() => onStageAction(target)}
                            >
                                <ActionIcon size={16} aria-hidden />
                                {isBusy ? "Please wait..." : actionLabel}
                            </Button>
                        ) : null}
                    </AppModalFooter>
                ) : undefined
            }
            className={styles.modal}
            bodyClassName={styles.body}
            headerClassName={styles.header}
            footerClassName={styles.footerBar}
            title={
                <span className={styles.modalTitle}>
                    {isLoading ? (
                        <>
                            <span className="sr-only">Deal details</span>
                            <Skeleton className="block-6 inline-32" />
                            <Skeleton className="rounded-full block-6 inline-24" />
                        </>
                    ) : (
                        title
                    )}
                    {!isLoading && statusLabel ? (
                        <Badge
                            variant={deal?.status === "closed" ? "brand" : "neutral"}
                            className={cn(
                                "font-medium",
                                deal && isLiveStage(deal.status)
                                    ? cn(
                                          DEAL_STAGE_META[deal.status].pillClass,
                                          "[--badge-dot:currentColor]",
                                      )
                                    : undefined,
                            )}
                        >
                            {statusLabel}
                        </Badge>
                    ) : null}
                </span>
            }
            descriptionClassName="font-medium"
            description={
                isLoading ? (
                    <Skeleton className="block-5 inline-28" />
                ) : deal ? (
                    `${deal.property.isRent ? "Rental" : "Sale"} deal${location ? ` - ${location}` : ""}`
                ) : (
                    "Property, people and progress in one place."
                )
            }
        >
            {isLoading ? (
                <PipelineDetailSkeleton />
            ) : error && !deal ? (
                <EmptyState
                    size="card"
                    variant="error"
                    icon={Briefcase}
                    heading="Could not load this deal"
                    description="Check your connection and try again."
                    action={
                        onRetry
                            ? { label: "Try again", icon: RefreshCw, onClick: onRetry }
                            : undefined
                    }
                />
            ) : deal ? (
                <div className={styles.layout}>
                    {error ? (
                        <p role="alert" className="body-xs text-urgent">
                            {error}
                        </p>
                    ) : null}

                    <section className={styles.property} aria-label="Property overview">
                        <div className={styles.propertyHeading}>
                            <h2>{deal.property.title}</h2>
                            <Badge
                                color={deal.property.isRent ? "orange" : "emerald"}
                                className="font-medium"
                            >
                                {deal.property.isRent ? "For rent" : "For sale"}
                            </Badge>
                        </div>
                        {location ? (
                            <p className={styles.location}>
                                <MapPin aria-hidden size={15} />
                                <span>{location}</span>
                            </p>
                        ) : null}
                        <div className={styles.askRow}>
                            <PriceWithCommission
                                amountInr={deal.property.amountInr}
                                isRent={deal.property.isRent}
                                commissionPercent={deal.property.commissionPercent}
                                commissionAmountInr={deal.property.commissionAmountInr}
                                audience="broker"
                                size="xl"
                                className="font-medium"
                            />
                            <span className="body-xs font-semibold text-ink-muted">
                                {deal.property.isRent ? "Monthly rent" : "Asking price"}
                            </span>
                        </div>
                    </section>
                    <Separator />
                    <section className={styles.figuresSection} aria-label="Deal figures and dates">
                        <h2 className={styles.sectionTitle}>Deal details</h2>
                        <div className={styles.facts}>
                            <DetailField label="Client budget" icon={Wallet}>
                                {formatMoney(deal.buyer.budgetMaxInr, deal.property.isRent)}
                            </DetailField>
                            <DetailField
                                label={FEATURE_PLATFORM_OWNER ? "Latest offer" : "Recorded offer"}
                                icon={HandCoins}
                            >
                                {deal.offerAmountInr != null ? (
                                    <>
                                        <span>
                                            {formatMoney(deal.offerAmountInr, deal.property.isRent)}
                                        </span>
                                        {FEATURE_PLATFORM_OWNER && deal.offerStatus ? (
                                            <Badge variant="neutral" className="font-medium">
                                                {OFFER_STATUS_LABEL[deal.offerStatus]}
                                            </Badge>
                                        ) : null}
                                    </>
                                ) : (
                                    <span className="text-ink-muted">No offer yet</span>
                                )}
                            </DetailField>
                            {deal.status === "closed" && deal.closedAmountInr != null ? (
                                <DetailField label="Closed at" icon={BadgeCheck}>
                                    {formatMoney(deal.closedAmountInr, deal.property.isRent)}
                                </DetailField>
                            ) : null}
                            {deal.status === "lost" && deal.lostReason ? (
                                <DetailField label="Reason for loss" icon={CircleX}>
                                    {lostReasonLabel(deal.lostReason)}
                                </DetailField>
                            ) : null}
                            {deal.nextVisitAt ? (
                                <DetailField label="Scheduled visit" icon={CalendarCheck}>
                                    {formatWhen(deal.nextVisitAt)}
                                </DetailField>
                            ) : null}
                        </div>
                    </section>
                    <Separator />
                    <div className={styles.gallery}>
                        <PropertyPhotoGallery
                            onLightboxChange={setLightboxOpen}
                            key={deal.id}
                            property={deal.property}
                        />
                    </div>
                    <section className={styles.peopleSection} aria-label="People in this deal">
                        <h2 className={styles.sectionTitle}>Client & owner</h2>
                        <div className={styles.contacts}>
                            <DealPerson
                                role="Client"
                                person={deal.buyer}
                                phone={deal.buyer.phoneDigits}
                            />
                            <DealPerson
                                role="Owner"
                                person={deal.owner}
                                phone={
                                    deal.owner.isRepresentationActive
                                        ? deal.owner.phoneDigits
                                        : undefined
                                }
                                phoneMessage={
                                    deal.owner.isRepresentationActive
                                        ? "Phone number not added"
                                        : "Phone number not shared"
                                }
                            />
                        </div>
                    </section>
                    <div className={styles.rightColumn}>
                        <DealNotes
                            key={`notes-${deal.id}`}
                            note={deal.note}
                            onSave={onSaveNote}
                            isBusy={isBusy}
                        />
                        <section className={styles.history} aria-label="Deal activity">
                            <div className={styles.sectionHeading}>
                                <h2 className={styles.sectionTitle}>Activity</h2>
                                <span className="body-xs text-ink-muted">Newest first</span>
                            </div>
                            <HistoryList
                                key={deal.id}
                                history={deal.history}
                                isRent={deal.property.isRent}
                            />
                        </section>
                    </div>
                </div>
            ) : null}
        </AppModal>
    );
}
