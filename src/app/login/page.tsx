"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Coffee, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [shake, setShake] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (error) {
      setShake(true)
      const timer = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        // Fetch and cache user data immediately after login
        try {
          const now = Date.now()

          // Fetch permissions
          const permissionsResponse = await fetch('/api/profile/permissions')
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json()
            if (permissionsData.permissions) {
              localStorage.setItem('app_permissions', JSON.stringify(permissionsData.permissions))
              localStorage.setItem('app_permissions_timestamp', now.toString())
            }
          }

          // Fetch user profile and auth user in one call
          const profileResponse = await fetch('/api/profile')
          if (profileResponse.ok) {
            const profileData = await profileResponse.json()
            // Cache the entire response (contains both user and profile)
            localStorage.setItem('app_user_profile', JSON.stringify(profileData))
            localStorage.setItem('app_user_profile_timestamp', now.toString())
          }
        } catch (cacheError) {
          // If caching fails, still proceed to dashboard
          console.error('Error caching user data:', cacheError)
        }

        router.push("/dashboard")
        router.refresh()
        // Keep loading true to prevent multiple clicks during redirect
      }
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("") // Clear error when user types
    setter(e.target.value)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Card className={cn("w-full max-w-md transition-all duration-300", shake && "animate-shake border-destructive/50 ring-2 ring-destructive/20")}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Coffee className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Coffee Shops CMS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className={cn(error && "text-destructive")}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleInputChange(setEmail)}
                required
                className={cn(error && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className={cn(error && "text-destructive")}>Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={handleInputChange(setPassword)}
                required
                className={cn(error && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
            {error && (
              <div className="rounded-lg bg-destructive/15 p-3 flex items-center gap-3 text-destructive animate-in slide-in-from-top-2 fade-in duration-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Need an account? Contact your administrator.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}