"use client";

import type { ReactNode } from "react";
import * as React from "react";
import toast from "react-hot-toast";

import { addCollection, Icon } from "@iconify/react/offline";

import { authApi } from "@/lib/api/auth";

import { Button } from "@/components/ui/button";

import type { Portal } from "./portal";
import brands from "./thesvg-color-brands.json";

addCollection(brands as Parameters<typeof addCollection>[0]);

function BrandIcon({ icon }: { icon: "thesvg-color:google" | "thesvg-color:apple-light" }) {
    return (
        <Icon icon={icon} width={20} height={20} className="block-5 inline-5" aria-hidden="true" />
    );
}

function SocialButton({
    children,
    mark,
    onClick,
    loading = false,
    disabled = false,
}: {
    children: ReactNode;
    mark: ReactNode;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
}) {
    return (
        <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onClick}
            loading={loading}
            disabled={disabled}
            className="
              gap-3 border-border-warm bg-surface font-medium text-ink shadow-sm inline-full
              hover:bg-surface-muted
            "
        >
            {loading ? null : mark}
            {children}
        </Button>
    );
}

export function SocialAuthButtons({
    action,
    role = "broker",
}: {
    action: "Sign in" | "Sign up";
    role?: Portal;
}) {
    const [isOpeningGoogle, setIsOpeningGoogle] = React.useState(false);

    function handleGoogle() {
        setIsOpeningGoogle(true);
        window.location.href = authApi.googleStartUrl({ role });
    }

    function handleApple() {
        toast("Apple sign-in is coming soon");
    }

    return (
        <div className="flex flex-col gap-3">
            <SocialButton
                mark={<BrandIcon icon="thesvg-color:google" />}
                onClick={handleGoogle}
                loading={isOpeningGoogle}
                disabled={isOpeningGoogle}
            >
                {isOpeningGoogle ? "Opening Google" : `${action} with Google`}
            </SocialButton>
            <SocialButton
                mark={<BrandIcon icon="thesvg-color:apple-light" />}
                onClick={handleApple}
                disabled={isOpeningGoogle}
            >
                {action} with Apple
            </SocialButton>
        </div>
    );
}
