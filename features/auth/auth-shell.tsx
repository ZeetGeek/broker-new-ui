export function AuthShell({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="flex flex-col bg-surface-muted min-block-svh">
            <div className="relative flex-1">{children}</div>
        </div>
    );
}
