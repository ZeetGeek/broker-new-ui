import { formatMaskedPhoneIn, formatPhoneIn } from "@/lib/format/phone";
import { cn } from "@/lib/utils";

export type PhoneNumberProps = {
    phoneDigits: string;
    isMasked?: boolean;
    className?: string;
};

export function PhoneNumber({ phoneDigits, isMasked = false, className }: PhoneNumberProps) {
    const formatted = isMasked ? formatMaskedPhoneIn(phoneDigits) : formatPhoneIn(phoneDigits);

    return <span className={cn("tabular", className)}>{formatted}</span>;
}
