export default function RegisterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="bg-canvas min-block-svh md:grid md:grid-cols-[3fr_2fr]">
            <div className="hidden bg-surface-muted md:block" aria-hidden="true" />
            <div className="flex items-center justify-center px-4 py-10 sm:px-8">
                {children}
            </div>
        </div>
    );
}
