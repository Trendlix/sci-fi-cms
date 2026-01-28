import type { PropsWithChildren } from "react"

import { cn } from "@/lib/utils"

function AuthBackground({ children }: PropsWithChildren) {
    return (
        <div
            className={cn(
                "relative min-h-dvh w-screen overflow-hidden",
                "bg-[radial-gradient(circle_at_top,#2b2b2b_0%,#121212_55%,#050505_100%)]",
                "flex items-center justify-center px-4 py-10"
            )}
        >
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-24 left-12 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 right-10 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
            </div>
            {children}
        </div>
    )
}

type AuthCardProps = PropsWithChildren<{
    className?: string
}>

function AuthCard({ children, className }: AuthCardProps) {
    return (
        <div
            className={cn(
                "relative w-full max-w-lg md:min-w-[400px] max-sm:w-[300px] rounded-3xl border border-white/25 bg-white/10 p-6 backdrop-blur-2xl",
                "ring-1 ring-white/15 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]",
                className
            )}
        >
            {children}
        </div>
    )
}

export { AuthBackground, AuthCard }

