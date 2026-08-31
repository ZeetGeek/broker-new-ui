"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Avatar, AvatarFallback, AvatarImage, stringHash } from "facehash";

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

const avatarFallbackColorClasses = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
];

function getAvatarColorClass(name: string) {
    const index = stringHash(name) % avatarFallbackColorClasses.length;
    return avatarFallbackColorClasses[index];
}

export type UserAvatarProps = VariantProps<typeof avatarVariants> & {
    name: string;
    imageUrl?: string;
    className?: string;
};

export function UserAvatar({ name, imageUrl, size, className }: UserAvatarProps) {
    const resolvedImageUrl = normalizeAvatarUrl(imageUrl);
    const hasPhoto = Boolean(resolvedImageUrl);

    return (
        <Avatar
            className={cn(avatarVariants({ size }), getAvatarColorClass(name), className, `pbs-1`)}
        >
            {hasPhoto ? (
                <AvatarImage src={resolvedImageUrl} alt={name} className={avatarMediaClass} />
            ) : null}
            <AvatarFallback
                name={name}
                className={avatarMediaClass}
                facehashProps={{
                    className: "size-full text-black",
                    variant: "solid",
                    intensity3d: "subtle",
                    enableBlink: true,
                }}
            />
        </Avatar>
    );
}
