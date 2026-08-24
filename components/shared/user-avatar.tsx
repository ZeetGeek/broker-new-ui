"use client";

import { Avatar, AvatarFallback, AvatarImage } from "facehash";

import { cn } from "@/lib/utils";

export type UserAvatarProps = {
    name: string;
    imageUrl?: string;
    className?: string;
};

export function UserAvatar({ name, imageUrl, className }: UserAvatarProps) {
    return (
        <Avatar
            className={cn(
                `
                  overflow-hidden rounded-full pbs-1 ring-1 ring-border-warm block-control-md
                  inline-control-md
                `,
                className,
            )}
        >
            {imageUrl ? <AvatarImage src={imageUrl} alt={name} className="object-cover" /> : null}
            <AvatarFallback
                name={name}
                className="block-full inline-full"
                facehashProps={{
                    className: "size-full text-ink",
                    variant: "solid",
                    intensity3d: "none",
                    enableBlink: true,
                }}
            />
        </Avatar>
    );
}
