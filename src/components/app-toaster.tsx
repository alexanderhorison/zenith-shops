"use client"

import { Toaster as SonnerToaster } from "@/components/ui/sonner"

export function AppToaster() {
    return (
        <SonnerToaster
            position="top-center"
            duration={7000}
            toastOptions={{
                classNames: {
                    toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg p-6",
                    description: "group-[.toast]:!text-zinc-600 dark:group-[.toast]:!text-zinc-400 text-sm",
                    actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                    cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
                },
            }}
        />
    )
}
