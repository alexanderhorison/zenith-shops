"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

interface LoadingIconButtonProps extends React.ComponentProps<typeof Button> {
    url: string
    icon: React.ReactNode
}

export function LoadingIconButton({ url, icon, className, onClick, ...props }: LoadingIconButtonProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        setIsLoading(true)
        if (onClick) onClick(e)
        router.push(url)
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            disabled={isLoading || props.disabled}
            className={cn("h-8 w-8 p-0", className)}
            {...props}
        >
            {isLoading ? (
                <Spinner className="h-4 w-4" />
            ) : (
                icon
            )}
        </Button>
    )
}
