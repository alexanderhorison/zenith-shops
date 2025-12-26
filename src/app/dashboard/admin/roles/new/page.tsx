"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Loader2, AlertCircle, Menu, Settings, Shield, ChevronDown } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Permission {
  id: number
  code: string
  name: string
  description: string | null
  category: 'menu' | 'action'
}

export default function NewRolePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loadingPermissions, setLoadingPermissions] = useState(true)
  const [error, setError] = useState<string>('')
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set())
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set())

  // Derived state
  const menuPermissions = allPermissions.filter(p => p.category === 'menu')
  const actionPermissions = allPermissions.filter(p => p.category === 'action')

  // Group action permissions by menu code
  const menuCodeToActions: { [menuCode: string]: Permission[] } = {}
  menuPermissions.forEach(menu => {
    const menuKey = menu.code.split('.')[1]
    menuCodeToActions[menu.id] = actionPermissions.filter(
      action => action.code.split('.')[1] === menuKey
    )
  })

  useEffect(() => {
    loadPermissions()
  }, [])

  const loadPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      const data = await response.json()
      if (response.ok) {
        setAllPermissions(data.permissions || [])
      } else {
        setError('Failed to load permissions')
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
      setError('Error loading permissions')
    } finally {
      setLoadingPermissions(false)
    }
  }

  const toggleMenuExpand = (menuId: number) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId)
    } else {
      newExpanded.add(menuId)
    }
    setExpandedMenus(newExpanded)
  }

  const handleMenuChange = (menuId: number, checked: boolean) => {
    const newSelected = new Set(selectedPermissions)

    if (checked) {
      newSelected.add(menuId)
      // Select all actions for this menu
      const actions = menuCodeToActions[menuId] || []
      actions.forEach(a => newSelected.add(a.id))
    } else {
      newSelected.delete(menuId)
      // Deselect all actions for this menu
      const actions = menuCodeToActions[menuId] || []
      actions.forEach(a => newSelected.delete(a.id))
    }

    setSelectedPermissions(newSelected)
  }

  const handleActionChange = (actionId: number, menuId: number, checked: boolean) => {
    const newSelected = new Set(selectedPermissions)

    if (checked) {
      newSelected.add(actionId)
      newSelected.add(menuId) // Auto-select menu
    } else {
      newSelected.delete(actionId)
      // Do not deselect menu
    }

    setSelectedPermissions(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      // First create the role
      const roleResponse = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const roleData = await roleResponse.json()

      if (!roleResponse.ok) {
        setError(roleData.error || 'Failed to create role')
        setSaving(false)
        return
      }

      // If permissions are selected, assign them to the new role
      if (selectedPermissions.size > 0) {
        const permissionsResponse = await fetch(`/api/admin/roles/${roleData.role.id}/permissions`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            permissionIds: Array.from(selectedPermissions),
          })
        })

        if (!permissionsResponse.ok) {
          const permData = await permissionsResponse.json()
          setError(permData.error || 'Role created but failed to assign permissions')
          setSaving(false)
          return
        }
      }

      router.push('/dashboard/admin/roles')
      router.refresh()
    } catch (error) {
      console.error('Error creating role:', error)
      setError('Error creating role')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/dashboard/admin/roles')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Role</h1>
          <p className="text-muted-foreground">
            Add a new role to the system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Role Information</CardTitle>
            <CardDescription>
              Define the role name and description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., moderator, manager"
                  required
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  Use lowercase with underscores for multiple words (e.g., content_manager)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the role's responsibilities and permissions..."
                  rows={6}
                  required
                  disabled={saving}
                />
                <p className="text-sm text-muted-foreground">
                  Provide a clear description of what this role can do
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Permissions</CardTitle>
            </div>
            <CardDescription>
              Select which menus and actions this role can access (actions appear under each menu)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              {/* Optional: Add global select all if needed, but not requested */}
              <Badge variant="secondary">
                {Array.from(selectedPermissions).reduce((count, id) => {
                  const perm = allPermissions.find(p => p.id === id)
                  if (!perm) return count

                  if (perm.category === 'action') {
                    return count + 1
                  }

                  if (perm.category === 'menu') {
                    const hasActions = (menuCodeToActions[perm.id]?.length || 0) > 0
                    return hasActions ? count : count + 1
                  }

                  return count
                }, 0)} selected
              </Badge>
            </div>

            {loadingPermissions ? (
              <div className="space-y-4">
                <div className="h-12 bg-muted rounded animate-pulse" />
                <div className="h-12 bg-muted rounded animate-pulse" />
                <div className="h-12 bg-muted rounded animate-pulse" />
              </div>
            ) : (
              <ScrollArea className="rounded-md">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1 items-start">
                  {menuPermissions.map(menu => (
                    <Collapsible
                      key={menu.id}
                      open={expandedMenus.has(menu.id)}
                      onOpenChange={() => toggleMenuExpand(menu.id)}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3 mb-1">
                        <Checkbox
                          id={`menu-${menu.id}`}
                          checked={selectedPermissions.has(menu.id)}
                          onCheckedChange={(checked) => handleMenuChange(menu.id, checked as boolean)}
                          disabled={saving}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <CollapsibleTrigger className="flex items-center justify-between w-full hover:text-accent-foreground/80 text-left">
                            <Label
                              htmlFor={`menu-${menu.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                              onClick={(e) => e.preventDefault()}
                            >
                              {menu.name}
                            </Label>
                            {menuCodeToActions[menu.id]?.length > 0 && (
                              <ChevronDown className={`h-4 w-4 transition-transform ${expandedMenus.has(menu.id) ? 'rotate-180' : ''}`} />
                            )}
                          </CollapsibleTrigger>
                          {menu.description && (
                            <p className="text-xs text-muted-foreground mt-1 pr-6">
                              {menu.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions List */}
                      {menuCodeToActions[menu.id]?.length > 0 && (
                        <CollapsibleContent>
                          <div className="ml-8 mt-4 space-y-2 border-l-2 pl-4 border-muted">
                            {menuCodeToActions[menu.id].map(action => (
                              <div key={action.id} className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors">
                                <Checkbox
                                  id={`action-${action.id}`}
                                  checked={selectedPermissions.has(action.id)}
                                  onCheckedChange={(checked) => handleActionChange(action.id, menu.id, checked as boolean)}
                                  disabled={saving}
                                />
                                <div className="flex-1">
                                  <Label
                                    htmlFor={`action-${action.id}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {action.name}
                                  </Label>
                                  {action.description && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {action.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/admin/roles')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Role
          </Button>
        </div>
      </form>
    </div>
  )
}
