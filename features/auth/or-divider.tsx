export function OrDivider() {
    return (
        <div className="flex items-center gap-4">
            <span
                aria-hidden="true"
                className="grow bg-linear-to-r from-transparent to-ink-subtle block-px"
            />
            <span className="body-sm text-ink-subtle">OR</span>
            <span
                aria-hidden="true"
                className="grow bg-linear-to-r from-ink-subtle to-transparent block-px"
            />
        </div>
    );
}
