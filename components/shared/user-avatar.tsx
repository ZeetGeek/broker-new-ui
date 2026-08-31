"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar, AvatarFallback, AvatarImage } from "facehash";

import { normalizeAvatarUrl } from "@/lib/auth/avatar";
import { cn } from "@/lib/utils";

const avatarVariants = cva("relative overflow-hidden rounded-full", {
    variants: {
        size: {
            sm: "block-control-sm inline-control-sm",
            md: "block-control-md inline-control-md",
            lg: "block-control-xl inline-control-xl",
            fill: "block-full inline-full",
        },
    },
    defaultVariants: {
        size: "md",
    },
});

const avatarMediaClass = "block-full inline-full object-cover object-center";

export type UserAvatarProps = VariantProps<typeof avatarVariants> & {
    name: string;
    imageUrl?: string;
    className?: string;
};

export function UserAvatar({ name, imageUrl, size, className }: UserAvatarProps) {
    const resolvedImageUrl = normalizeAvatarUrl(imageUrl);
    const hasPhoto = Boolean(resolvedImageUrl);

    return (
        <Avatar className={cn(avatarVariants({ size }), className)}>
            {hasPhoto ? (
                <AvatarImage src={resolvedImageUrl} alt={name} className={avatarMediaClass} />
            ) : null}
            <AvatarFallback
                name={name}
                className={avatarMediaClass}
                facehashProps={{
                    className: "size-full scale-110 text-ink",
                    variant: "solid",
                    intensity3d: "dramatic",
                    enableBlink: true,
                }}
            />
        </Avatar>
    );
}
