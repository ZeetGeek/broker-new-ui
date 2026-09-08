import type { LucideIcon } from "lucide-react";
import { File as FileIcon,FileImage, FileSpreadsheet, FileText } from "lucide-react";

/**
 * What a buyer document is for. Kept deliberately short — a broker filing a
 * PAN card should not have to read a list of twenty options.
 */
export type BuyerDocumentKind = "id_proof" | "address_proof" | "income" | "loan" | "other";

export const BUYER_DOCUMENT_KIND_LABEL: Record<BuyerDocumentKind, string> = {
    id_proof: "ID proof",
    address_proof: "Address proof",
    income: "Income proof",
    loan: "Loan paper",
    other: "Other",
};

/** Order shown in the picker. "Other" stays last so it reads as the fallback. */
export const BUYER_DOCUMENT_KINDS: BuyerDocumentKind[] = [
    "id_proof",
    "address_proof",
    "income",
    "loan",
    "other",
];

/**
 * One attached file. `url` is an object URL while the record is local; the API
 * replaces it with a real one once the file is stored.
 */
export type BuyerDocument = {
    id: string;
    fileName: string;
    /** Bytes. Kept raw so the UI can format it per locale. */
    sizeBytes: number;
    mimeType: string;
    kind: BuyerDocumentKind;
    /** ISO instant the broker attached it. */
    uploadedAt: string;
    /** Where to open it. Blob URL locally, CDN URL from the API. */
    url: string;
};

/**
 * Accepted types. PDFs and photos cover what a broker actually receives on
 * WhatsApp; Office formats are here because banks still send loan sanction
 * letters as .doc. Anything executable is refused by omission.
 */
export const ACCEPTED_DOCUMENT_TYPES: Record<string, string> = {
    "application/pdf": "PDF",
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WebP",
    "image/heic": "HEIC",
    "application/msword": "DOC",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

/** Extensions matching the map above, for the file input's `accept`. */
export const ACCEPTED_DOCUMENT_EXTENSIONS = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx";

/**
 * 10 MB a file. A phone photo of an Aadhaar card is around 3 MB, and a scanned
 * multi-page bank statement rarely passes 8, so this clears real documents
 * without letting someone upload a video over mobile data.
 */
export const MAX_DOCUMENT_SIZE_MB = 10;

/** Files per buyer. Enough for ID, address, income and a loan letter, twice. */
export const MAX_DOCUMENTS_PER_BUYER = 8;

/** Longest filename kept. Anything longer is truncated for display only. */
export const MAX_DOCUMENT_NAME_LENGTH = 120;

export type DocumentRejection = { fileName: string; reason: string };

/** Human-readable size. `1.4 MB`, `812 KB` — never a raw byte count. */
export function formatFileSize(sizeBytes: number): string {
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Icon standing in for the file, since documents have no thumbnail. */
export function documentIcon(mimeType: string): LucideIcon {
    if (mimeType.startsWith("image/")) return FileImage;
    if (mimeType === "application/pdf") return FileText;
    if (mimeType.includes("word")) return FileSpreadsheet;
    return FileIcon;
}

/** Short type label for the row, e.g. `PDF`. */
export function documentTypeLabel(mimeType: string): string {
    return ACCEPTED_DOCUMENT_TYPES[mimeType] ?? "File";
}

/**
 * Checks one file against every rule. Returns null when it passes.
 *
 * Type is checked before size so a rejected `.exe` is never reported as
 * merely too large, and an empty file is caught explicitly — a 0-byte upload
 * is a failed transfer, not a document.
 */
export function rejectionFor(
    file: File,
    { alreadyAttached }: { alreadyAttached: number },
): string | null {
    if (!ACCEPTED_DOCUMENT_TYPES[file.type]) {
        return "not a PDF, image, or Word file";
    }
    if (file.size === 0) {
        return "the file is empty";
    }
    if (file.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
        return `larger than ${MAX_DOCUMENT_SIZE_MB} MB`;
    }
    if (alreadyAttached >= MAX_DOCUMENTS_PER_BUYER) {
        return `more than ${MAX_DOCUMENTS_PER_BUYER} files`;
    }
    return null;
}

/** Guesses what a file is from its name, so the broker rarely has to pick. */
export function guessDocumentKind(fileName: string): BuyerDocumentKind {
    const name = fileName.toLowerCase();

    if (/aadhaar|aadhar|pan|passport|voter|licence|license/.test(name)) return "id_proof";
    if (/address|electric|utility|ration|rent.?agreement/.test(name)) return "address_proof";
    if (/salary|payslip|pay.?slip|itr|income|form.?16|bank.?statement/.test(name)) return "income";
    if (/loan|sanction|emi|mortgage/.test(name)) return "loan";

    return "other";
}
