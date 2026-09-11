"use client";

import { type DragEvent, useCallback, useId, useRef, useState } from "react";

import type { LucideIcon } from "lucide-react";
import { Paperclip, Trash2, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
    ACCEPTED_DOCUMENT_EXTENSIONS,
    BUYER_DOCUMENT_KIND_LABEL,
    BUYER_DOCUMENT_KINDS,
    type BuyerDocument,
    type BuyerDocumentKind,
    documentIcon,
    type DocumentRejection,
    documentTypeLabel,
    formatFileSize,
    guessDocumentKind,
    MAX_DOCUMENT_SIZE_MB,
    MAX_DOCUMENTS_PER_BUYER,
    rejectionFor,
} from "@/features/contacts/document-rules";

/**
 * Renders the icon standing in for a file type. The component arrives as a
 * prop — the same shape `EmptyState` uses — so React sees a stable component
 * type rather than one resolved mid-render.
 */
function DocumentGlyph({ icon: Icon }: { icon: LucideIcon }) {
    return <Icon className="block-4.5 inline-4.5" strokeWidth={1.75} aria-hidden />;
}

/** One attached file: what it is, how big, and how to change or drop it. */
function DocumentRow({
    document: doc,
    onKindChange,
    onRemove,
    disabled,
}: {
    document: BuyerDocument;
    onKindChange: (id: string, kind: BuyerDocumentKind) => void;
    onRemove: (id: string) => void;
    disabled?: boolean;
}) {
    return (
        <li
            className="
              flex items-center gap-3 rounded-inner border border-border-warm bg-surface p-2.5
            "
        >
            <span
                aria-hidden
                className="
                  flex shrink-0 items-center justify-center rounded-inner bg-surface-muted
                  text-ink-muted block-10 inline-10
                "
            >
                <DocumentGlyph icon={documentIcon(doc.mimeType)} />
            </span>

            <div className="flex flex-1 flex-col gap-0.5 min-inline-0">
                {/* The name is the one thing that identifies the file, so it
                    gets the row's spare width and a tooltip when it truncates. */}
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <a
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                                  body-sm truncate font-medium text-ink
                                  hover:text-brand-text hover:underline
                                "
                            >
                                {doc.fileName}
                            </a>
                        }
                    />
                    <TooltipContent>Open {doc.fileName}</TooltipContent>
                </Tooltip>

                <p className="body-xs text-ink-subtle">
                    {documentTypeLabel(doc.mimeType)} ·{" "}
                    <span className="tabular">{formatFileSize(doc.sizeBytes)}</span>
                </p>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <button
                            type="button"
                            disabled={disabled}
                            className="
                              body-xs shrink-0 rounded-control border border-border-warm bg-surface
                              px-3 py-1.5 font-medium text-ink-muted transition-colors duration-160
                              hover:border-brand/40 hover:text-ink
                            "
                        />
                    }
                >
                    {BUYER_DOCUMENT_KIND_LABEL[doc.kind]}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {BUYER_DOCUMENT_KINDS.map((kind) => (
                        <DropdownMenuItem
                            key={kind}
                            onClick={() => onKindChange(doc.id, kind)}
                            className={cn(doc.kind === kind && "font-semibold")}
                        >
                            {BUYER_DOCUMENT_KIND_LABEL[kind]}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
                <TooltipTrigger
                    render={
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={disabled}
                            onClick={() => onRemove(doc.id)}
                            aria-label={`Remove ${doc.fileName}`}
                            className="shrink-0 text-ink-muted hover:text-danger"
                        />
                    }
                >
                    <Trash2 aria-hidden strokeWidth={1.75} />
                </TooltipTrigger>
                <TooltipContent>Remove this file</TooltipContent>
            </Tooltip>
        </li>
    );
}

/**
 * Attach files to a buyer: KYC papers, loan letters, whatever the broker was
 * sent. Validation lives in `document-rules.ts` so the same limits apply
 * whether a file arrives by click or by drag.
 */
export function DocumentUploader({
    documents,
    onChange,
    disabled,
}: {
    documents: BuyerDocument[];
    onChange: (next: BuyerDocument[]) => void;
    disabled?: boolean;
}) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [rejections, setRejections] = useState<DocumentRejection[]>([]);

    const remaining = MAX_DOCUMENTS_PER_BUYER - documents.length;
    const isFull = remaining <= 0;
    const isDisabled = disabled || isFull;

    const handleFiles = useCallback(
        (fileList: FileList | null) => {
            if (!fileList || disabled) return;

            const accepted: BuyerDocument[] = [];
            const rejected: DocumentRejection[] = [];

            for (const file of Array.from(fileList)) {
                const reason = rejectionFor(file, {
                    alreadyAttached: documents.length + accepted.length,
                });

                if (reason) {
                    rejected.push({ fileName: file.name, reason });
                    continue;
                }

                // The same file picked twice is almost always a mis-click.
                const isDuplicate = [...documents, ...accepted].some(
                    (existing) =>
                        existing.fileName === file.name && existing.sizeBytes === file.size,
                );
                if (isDuplicate) {
                    rejected.push({ fileName: file.name, reason: "already attached" });
                    continue;
                }

                accepted.push({
                    id: `doc_${Date.now().toString(36)}_${accepted.length}`,
                    fileName: file.name,
                    sizeBytes: file.size,
                    mimeType: file.type,
                    kind: guessDocumentKind(file.name),
                    uploadedAt: new Date().toISOString(),
                    url: URL.createObjectURL(file),
                });
            }

            if (accepted.length > 0) onChange([...documents, ...accepted]);
            setRejections(rejected);

            // Clearing lets the same file be re-picked after a removal.
            if (inputRef.current) inputRef.current.value = "";
        },
        [disabled, documents, onChange],
    );

    const handleRemove = useCallback(
        (id: string) => {
            const target = documents.find((doc) => doc.id === id);
            // Blob URLs leak until revoked, and this one is about to be dropped.
            if (target?.url.startsWith("blob:")) URL.revokeObjectURL(target.url);
            onChange(documents.filter((doc) => doc.id !== id));
            setRejections([]);
        },
        [documents, onChange],
    );

    const handleKindChange = useCallback(
        (id: string, kind: BuyerDocumentKind) => {
            onChange(documents.map((doc) => (doc.id === id ? { ...doc, kind } : doc)));
        },
        [documents, onChange],
    );

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsDragging(false);
        if (!isDisabled) handleFiles(event.dataTransfer.files);
    }

    return (
        <div className="flex flex-col gap-3">
            <div
                onDragOver={(event) => {
                    event.preventDefault();
                    if (!isDisabled) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                    `
                      flex flex-col items-center justify-center gap-1.5 rounded-inner border-2
                      border-dashed border-border-warm bg-surface p-6 text-center transition-colors
                      duration-160 inline-full
                    `,
                    isDragging && "border-brand bg-brand-soft",
                    isDisabled && "opacity-60",
                )}
            >
                <input
                    ref={inputRef}
                    id={inputId}
                    type="file"
                    multiple
                    accept={ACCEPTED_DOCUMENT_EXTENSIONS}
                    disabled={isDisabled}
                    onChange={(event) => handleFiles(event.target.files)}
                    className="sr-only"
                />

                <span
                    aria-hidden
                    className="
                      flex items-center justify-center rounded-control bg-surface-muted text-ink-muted
                      block-10 inline-10
                    "
                >
                    <Upload className="block-4.5 inline-4.5" strokeWidth={1.75} />
                </span>

                {isFull ? (
                    <p className="body-sm font-medium text-ink">
                        You have attached the most files allowed
                    </p>
                ) : (
                    <>
                        <label
                            htmlFor={inputId}
                            className={cn(
                                "body-sm font-semibold text-brand-text",
                                isDisabled ? "cursor-not-allowed" : "cursor-pointer hover:underline",
                            )}
                        >
                            Choose files
                        </label>
                        <p className="body-xs text-ink-subtle">
                            or drag them here · PDF, image or Word · up to {MAX_DOCUMENT_SIZE_MB} MB
                            each · {remaining} left
                        </p>
                    </>
                )}
            </div>

            {rejections.length > 0 ? (
                <ul role="alert" className="flex flex-col gap-1">
                    {rejections.map((rejection) => (
                        <li key={rejection.fileName} className="body-xs text-danger">
                            {rejection.fileName} was not added — {rejection.reason}.
                        </li>
                    ))}
                </ul>
            ) : null}

            {documents.length > 0 ? (
                <>
                    <p className="body-xs flex items-center gap-1.5 text-ink-muted">
                        <Paperclip aria-hidden className="block-3.5 inline-3.5" strokeWidth={1.75} />
                        {documents.length} of {MAX_DOCUMENTS_PER_BUYER} attached
                    </p>

                    <ul className="flex flex-col gap-2">
                        {documents.map((doc) => (
                            <DocumentRow
                                key={doc.id}
                                document={doc}
                                onKindChange={handleKindChange}
                                onRemove={handleRemove}
                                disabled={disabled}
                            />
                        ))}
                    </ul>
                </>
            ) : null}
        </div>
    );
}
