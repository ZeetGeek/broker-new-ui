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
                  overflow-hidden rounded-full bg-linear-to-b from-brand-ink/20 via-brand/15
                  to-brand-deep/20 p-[2px] pbs-[5px] ring-1 ring-border-warm block-control-sm
                  inline-control-sm
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
                    variant: "gradient",
                    intensity3d: "none",
                    enableBlink: true,
                }}
            />
        </Avatar>
    );
}
