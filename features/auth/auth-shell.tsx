export function AuthShell({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <div className="relative bg-surface-muted min-block-svh">{children}</div>;
}
