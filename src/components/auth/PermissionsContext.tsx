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
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    setPermissions([])
                    setIsLoading(false)
                    return
                }

                // Fetch all permissions for the user directly
                // Query path: user_profiles -> roles -> role_permissions -> permissions
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select(`
            role:roles!inner (
              role_permissions!inner (
                permission:permissions!inner (
                  code
                )
              )
            )
          `)
                    .eq('user_id', user.id)

                if (error) {
                    console.error('Error fetching permissions:', error)
                    setPermissions([])
                } else if (data && data.length > 0) {
                    // Parse the nested structure
                    // Explicitly type the result to avoid 'unknown' errors
                    const profile = data[0] as unknown as {
                        role: {
                            role_permissions: Array<{
                                permission: {
                                    code: string
                                }
                            }>
                        }
                    }

                    if (profile?.role?.role_permissions) {
                        const codes = profile.role.role_permissions
                            .map(rp => rp.permission?.code)
                            .filter(Boolean)

                        setPermissions(codes)
                    }
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
