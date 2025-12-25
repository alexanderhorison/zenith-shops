"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"


interface PermissionsContextType {
    permissions: string[]
    isLoading: boolean
    hasPermission: (permissionCode: string) => boolean
    menuPermissions: string[]
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined)

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const [permissions, setPermissions] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchPermissions = async () => {
            const cached = localStorage.getItem('app_permissions')
            // Optimistically set cached permissions if available
            if (cached) {
                try {
                    const parsed = JSON.parse(cached)
                    setPermissions(parsed)
                    setIsLoading(false)
                } catch (e) {
                    console.error('Error parsing cached permissions', e)
                    localStorage.removeItem('app_permissions')
                }
            }

            try {
                // Fetch permissions from our secure API
                const response = await fetch('/api/profile/permissions')
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch permissions')
                }

                if (data.permissions) {
                    setPermissions(data.permissions)
                    localStorage.setItem('app_permissions', JSON.stringify(data.permissions))
                }
            } catch (error) {
                console.error('Error in permission provider:', error)
                setPermissions([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchPermissions()
    }, [])

    const hasPermission = (permissionCode: string) => {
        return permissions.includes(permissionCode)
    }

    const menuPermissions = permissions.filter(p => p.startsWith('menu.'))

    return (
        <PermissionsContext.Provider value={{ permissions, isLoading, hasPermission, menuPermissions }}>
            {children}
        </PermissionsContext.Provider>
    )
}

export function usePermissions() {
    const context = useContext(PermissionsContext)
    if (context === undefined) {
        throw new Error("usePermissions must be used within a PermissionsProvider")
    }
    return context
}
