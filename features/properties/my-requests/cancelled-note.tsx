import { Ban } from "@/components/shared/icons";

/** Who ended the representation and why, on a Cancelled card. */
export function CancelledNote({
    endedBy,
    reason,
    viewer = "broker",
}: {
    endedBy?: "owner" | "broker";
    reason?: string;
    /** Whose card this is — wording is "you" for the viewer's own side. */
    viewer?: "owner" | "broker";
}) {
    const who =
        viewer === "owner"
            ? endedBy === "owner"
                ? "You removed this broker"
                : "The broker stopped selling"
            : endedBy === "owner"
              ? "The owner cancelled"
              : "You stopped selling";

    return (
        <p className="body-sm flex items-start gap-1.5 text-ink-muted">
            <Ban aria-hidden className="mbs-0.5 shrink-0 block-4 inline-4" strokeWidth={1.75} />
            <span className="line-clamp-2 min-inline-0">
                <span className="font-medium text-ink">{who}.</span>
                {reason ? ` “${reason}”` : " No reason given."}
            </span>
        </p>
    );
}
