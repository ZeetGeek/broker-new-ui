import { Shield } from "lucide-react";

export function ReraBanner() {
    return (
        <div
            role="status"
            className="
              flex items-start gap-3 rounded-card bg-urgent-soft px-4 py-3 text-urgent
              md:items-center md:px-5
            "
        >
            <Shield
                aria-hidden
                className="mbs-0.5 shrink-0 block-5 inline-5 md:mbs-0"
                strokeWidth={1.75}
            />
            <p className="body-sm font-medium">
                Verifying your RERA number — usually within 24 hours. You can browse meanwhile.
            </p>
        </div>
    );
}
