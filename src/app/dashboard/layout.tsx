"use client"

import { Coffee, LogOut, ChevronDown, User as UserIcon, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useEffect, useState, useRef } from "react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { PermissionsProvider, usePermissions } from "@/components/auth/PermissionsContext"
import { PERMISSIONS } from "@/lib/permission-constants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"

// Menu items
import { MENU_GROUPS } from "@/config/menu-config"



interface UserProfile {
  id: string
  email: string
  full_name?: string
  role?: {
    name: string
    description: string
  } | null
}

interface AuthUser {
  id: string
  email?: string
  user_metadata?: {
    avatar_url?: string
    full_name?: string
    [key: string]: unknown
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const hasFetchedProfile = useRef(false)

  useEffect(() => {
    // Only fetch once per mount
    if (hasFetchedProfile.current) {
      setLoading(false)
      return
    }
    hasFetchedProfile.current = true

    const getUser = async () => {
      const CACHE_KEY = 'app_user_profile'
      const CACHE_TIME_KEY = 'app_user_profile_timestamp'
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
            // Cache is fresh, use it
            setUser(parsed.user)
            setUserProfile(parsed.profile)
            setLoading(false)
            return
          }
        } catch (e) {
          console.error('Error parsing cached profile', e)
          localStorage.removeItem(CACHE_KEY)
          localStorage.removeItem(CACHE_TIME_KEY)
        }
      }

      // Cache miss or expired, fetch fresh data from unified endpoint
      try {
        const response = await fetch('/api/profile')
        if (!response.ok) {
          throw new Error('Failed to fetch profile')
        }

        const data = await response.json()

        setUser(data.user)
        setUserProfile(data.profile)

        // Update cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
        localStorage.setItem(CACHE_TIME_KEY, now.toString())
      } catch (error) {
        console.error('Error fetching profile:', error)
      }

      setLoading(false)
    }
    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('app_permissions')
    localStorage.removeItem('app_permissions_timestamp')
    localStorage.removeItem('app_user_profile')
    localStorage.removeItem('app_user_profile_timestamp')
    router.push("/login")
    router.refresh()
  }



  if (loading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className="shrink-0">
            <SidebarHeader className="border-b px-6 py-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>
                  <Skeleton className="h-4 w-24" />
                </SidebarGroupLabel>
                <SidebarGroupContent className="space-y-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <div className="flex items-center gap-3 p-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>
          <div className="flex flex-1 flex-col min-w-0">
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-full space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full rounded-lg" />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <PermissionsProvider>
      <LayoutContent
        user={user}
        userProfile={userProfile}
        showLogoutDialog={showLogoutDialog}
        setShowLogoutDialog={setShowLogoutDialog}
        handleSignOut={handleSignOut}
        pathname={pathname}
      >
        {children}
      </LayoutContent>
    </PermissionsProvider>
  )
}

function LayoutContent({
  user,
  userProfile,
  showLogoutDialog,
  setShowLogoutDialog,
  handleSignOut,
  pathname,
  children
}: {
  user: AuthUser | null
  userProfile: UserProfile | null
  showLogoutDialog: boolean
  setShowLogoutDialog: (show: boolean) => void
  handleSignOut: () => void
  pathname: string
  children: React.ReactNode
}) {
  const { menuPermissions: permissions } = usePermissions()
  const router = useRouter()

  return (
    <>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <Sidebar className="shrink-0">
            <SidebarHeader className="border-b px-6 py-4">
              <div className="flex items-center space-x-2">
                <Coffee className="h-6 w-6 text-orange-500" />
                <span className="text-lg font-semibold">Coffee Shops</span>
              </div>
            </SidebarHeader>
            <SidebarContent>
              {MENU_GROUPS.map((group) => {
                // Filter items based on permissions
                const visibleItems = group.items.filter(item => {
                  if (!item.permission) return true
                  return permissions.includes(item.permission)
                })

                if (visibleItems.length === 0) return null

                return (
                  <SidebarGroup key={group.label}>
                    <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {visibleItems.map((item) => (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                              asChild
                              isActive={item.url === '/dashboard' ? pathname === item.url : pathname.startsWith(item.url)}
                            >
                              <Link href={item.url} className="flex items-center gap-2">
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )
              })}
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      >
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage src={user?.user_metadata?.avatar_url} alt={userProfile?.full_name || user?.email || ''} />
                          <AvatarFallback className="rounded-lg">
                            {userProfile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {userProfile?.full_name || user?.email}
                          </span>
                          <span className="truncate text-xs capitalize">
                            {userProfile?.role?.name?.replace('_', ' ') || 'User'}
                          </span>
                        </div>
                        <ChevronDown className="ml-auto size-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                      side="bottom"
                      align="end"
                      sideOffset={4}
                    >
                      <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={user?.user_metadata?.avatar_url} alt={userProfile?.full_name || user?.email || ''} />
                            <AvatarFallback className="rounded-lg">
                              {userProfile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">
                              {userProfile?.full_name || user?.email}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {userProfile?.email || user?.email}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/dashboard/settings/profile')}>
                        <UserIcon />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/dashboard/settings/password')}>
                        <Lock />
                        Change Password
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowLogoutDialog(true)}>
                        <LogOut />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar >
          <div className="flex flex-1 flex-col min-w-0">
            <main className="flex-1 overflow-auto p-6">
              <div className="max-w-full">
                {children}
              </div>
            </main>
          </div>
        </div >
      </SidebarProvider >

      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleSignOut}
        title="Log out?"
        description="This will log you out of your account. You'll need to sign in again to access the dashboard."
        icon={LogOut}
        confirmText="Log out"
      />
    </>
  )
}