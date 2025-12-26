"use client"

import React, { createContext, useContext, useEffect, useState, useRef } from "react"
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
    const hasFetched = useRef(false)

    useEffect(() => {
        // Only run once per mount
        if (hasFetched.current) return
        hasFetched.current = true

        const fetchPermissions = async () => {
            const CACHE_KEY = 'app_permissions'
            const CACHE_TIME_KEY = 'app_permissions_timestamp'
            const CACHE_EXPIRATION = 10 * 60 * 1000 // 10 minutes

            const cached = localStorage.getItem(CACHE_KEY)
            const cachedTimestamp = localStorage.getItem(CACHE_TIME_KEY)
            const now = Date.now()

            // Try to use cache if it's not expired
            if (cached && cachedTimestamp) {
                try {
                    const parsed = JSON.parse(cached)
                    const timestamp = parseInt(cachedTimestamp)

                    if (now - timestamp < CACHE_EXPIRATION) {
                        setPermissions(parsed)
                        setIsLoading(false)
                        return // Exit early if cache is fresh
                    }
                } catch (e) {
                    console.error('Error parsing cached permissions', e)
                    localStorage.removeItem(CACHE_KEY)
                    localStorage.removeItem(CACHE_TIME_KEY)
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
                    localStorage.setItem(CACHE_KEY, JSON.stringify(data.permissions))
                    localStorage.setItem(CACHE_TIME_KEY, now.toString())
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
