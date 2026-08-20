import { AuthShell } from "@/features/auth/auth-shell";

export default function RegisterLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return <AuthShell>{children}</AuthShell>;
}
