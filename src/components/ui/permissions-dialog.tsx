"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Shield, ChevronDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getToastTimestamp } from "@/lib/utils"
import { toast } from "sonner"

// ... inside the component ...

interface Permission {
  id: number
  code: string
  name: string
  description: string | null
  category: 'menu' | 'action'
}

interface PermissionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roleId: number
  roleName: string
  onSaved: () => void
}

export function PermissionsDialog({
  open,
  onOpenChange,
  roleId,
  roleName,
  onSaved,
}: PermissionsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set())
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (open) {
      loadPermissions()
      loadRolePermissions()
    }
  }, [open, roleId])

  const toggleMenuExpand = (menuId: number) => {
    const newExpanded = new Set(expandedMenus)
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId)
    } else {
      newExpanded.add(menuId)
    }
    setExpandedMenus(newExpanded)
  }

  const loadPermissions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/permissions')
      const data = await response.json()
      if (response.ok) {
        setAllPermissions(data.permissions || [])
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRolePermissions = async () => {
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`)
      const data = await response.json()
      if (response.ok) {
        const permissionIds = (data.permissions || []).map((p: Permission) => p.id)
        setSelectedPermissions(new Set(permissionIds))
      }
    } catch (error) {
      console.error('Error loading role permissions:', error)
    }
  }

  const menuPermissions = allPermissions.filter(p => p.category === 'menu')
  const actionPermissions = allPermissions.filter(p => p.category === 'action')

  // Group action permissions by menu code for logic
  const menuCodeToActions: { [menuCode: string]: Permission[] } = {}
  menuPermissions.forEach(menu => {
    const menuKey = menu.code.split('.')[1]
    menuCodeToActions[menu.id] = actionPermissions.filter(
      action => action.code.split('.')[1] === menuKey
    )
  })

  // Group action permissions by resource for display
  const groupedActions: { [key: string]: Permission[] } = {}
  actionPermissions.forEach(permission => {
    const resource = permission.code.split('.')[1] || 'other'
    if (!groupedActions[resource]) {
      groupedActions[resource] = []
    }
    groupedActions[resource].push(permission)
  })

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

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissionIds: Array.from(selectedPermissions),
        }),
      })

      if (response.ok) {
        toast.success('Permissions saved successfully', {
          description: getToastTimestamp(),
        })
        onSaved()
        onOpenChange(false)
      } else {
        const data = await response.json()
        toast.error('Failed to save permissions', {
          description: data.error || 'Unknown error occurred',
        })
      }
    } catch (error) {
      console.error('Error saving permissions:', error)
      toast.error('Error saving permissions', {
        description: 'An unexpected error occurred',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSelectAll = (category?: 'menu' | 'action', groupPermissions?: Permission[]) => {
    const newSelected = new Set(selectedPermissions)
    const targets = groupPermissions || allPermissions.filter(p => !category || p.category === category)
    targets.forEach(p => newSelected.add(p.id))
    setSelectedPermissions(newSelected)
  }

  const handleDeselectAll = (category?: 'menu' | 'action', groupPermissions?: Permission[]) => {
    const newSelected = new Set(selectedPermissions)
    const targets = groupPermissions || allPermissions.filter(p => !category || p.category === category)
    targets.forEach(p => newSelected.delete(p.id))
    setSelectedPermissions(newSelected)
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">

        {/* Header */}
        <div className="p-6 pb-2">
          <DialogHeader className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-xl">Manage Permissions for {roleName}</DialogTitle>
                <div className="text-sm text-muted-foreground">
                  Select which menus and actions this role can access (actions appear under each menu)
                </div>
              </div>
            </div>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-6 py-2">
          {loading ? (
            <div className="space-y-4 py-4">
              <div className="h-24 bg-muted rounded-lg animate-pulse" />
              <div className="h-24 bg-muted rounded-lg animate-pulse" />
            </div>
          ) : (
            <div className="space-y-4 pb-6">

              <div className="flex items-center justify-between mb-4">
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

              <div className="grid grid-cols-1 gap-4">
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

            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-muted/10 flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-10 px-6 rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="h-10 px-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
