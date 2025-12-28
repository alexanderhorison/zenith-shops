"use client"

import { Toaster as SonnerToaster } from "@/components/ui/sonner"

export function AppToaster() {
    return (
        <SonnerToaster
            position="top-center"
            duration={5000}
        />
    )
}
