import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

const Skeleton = ({ className, ...props }: SkeletonProps) => (
    <div
        className={cn("animate-pulse rounded-md bg-white/10", className)}
        {...props}
    />
);

export { Skeleton };

