export default function RegisterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <div className="bg-canvas block-svh">{children}</div>;
}
