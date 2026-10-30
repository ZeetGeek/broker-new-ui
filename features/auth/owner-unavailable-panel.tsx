"use client";

import { useState } from "react";
import Link from "next/link";

import { useRouter } from "@/lib/navigation";

import { Button } from "@/components/ui/button";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/auth-slice";
import { resetDashboard } from "@/store/slices/dashboard-slice";

import { AuthFormFrame } from "./auth-back-link";

export function OwnerUnavailablePanel() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { accessToken, hydrated } = useAppSelector((state) => state.auth);
    const [isSigningOut, setIsSigningOut] = useState(false);

    async function switchAccount() {
        setIsSigningOut(true);
        await dispatch(logout());
        dispatch(resetDashboard());
        router.replace("/login");
    }

    return (
        <AuthFormFrame>
            <div className="mx-auto flex flex-col gap-6 text-center inline-full max-inline-96">
                <h1 className="h1 text-ink">Owner accounts are not available yet</h1>
                <p className="body text-ink">
                    This launch is for brokers. Your owner account has not changed. Please check
                    back when owner access opens.
                </p>
                {accessToken ? (
                    <Button size="lg" loading={isSigningOut} onClick={() => void switchAccount()}>
                        Sign out and use another account
                    </Button>
                ) : (
                    <Button size="lg" disabled={!hydrated} render={<Link href="/login" />}>
                        Sign in as a broker
                    </Button>
                )}
            </div>
        </AuthFormFrame>
    );
}
