import { useState, useEffect } from 'react'
import { ShieldCheck, LayoutDashboard, Copy } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { updateUsuario, type Usuario } from '@/services/usuarios'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import {
  MENU_ACCESS_GROUPS,
  MENU_KEY_LABELS,
  PERMISSION_TEMPLATES,
  DEFAULT_USER_ACCESS,
  type MenuAccess,
} from '@/lib/menu-access'
import pb from '@/lib/pocketbase/client'

interface UserAccessSheetProps {
  user: Usuario | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function UserAccessSheet({ user, open, onOpenChange, onSaved }: UserAccessSheetProps) {
  const { toast } = useToast()
  const { user: currentUser, refreshUser } = useAuth()
  const [role, setRole] = useState<'admin' | 'user'>('user')
  const [bidding, setBidding] = useState(false)
  const [setor, setSetor] = useState('')
  const [access, setAccess] = useState<MenuAccess>({})
  const [dashboardConfigs, setDashboardConfigs] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user && open) {
      setRole(user.role || 'user')
      setBidding(user.can_issue_bidding_proposals || false)
      setSetor(user.setor || '')
      setAccess(user.menu_access || { ...DEFAULT_USER_ACCESS })
      loadDashboardConfigs(user.role || 'user')
    }
  }, [user, open])

  const loadDashboardConfigs = async (perfil: string) => {
    try {
      const configs = await pb.collection('configuracoes_dashboard').getFullList({
        filter: `perfil = "${perfil}"`,
      })
      setDashboardConfigs(configs)
    } catch {
      setDashboardConfigs([])
    }
  }

  const handleRoleChange = (newRole: 'admin' | 'user') => {
    setRole(newRole)
    loadDashboardConfigs(newRole)
  }

  const applyTemplate = (templateAccess: MenuAccess) => {
    setAccess({ ...templateAccess })
    toast({ title: 'Modelo aplicado! Revise e salve.' })
  }

  const toggleDashboardConfig = async (id: string, visivel: boolean) => {
    try {
      await pb.collection('configuracoes_dashboard').update(id, { visivel })
      setDashboardConfigs((prev) => prev.map((c) => (c.id === id ? { ...c, visivel } : c)))
    } catch (e) {
      toast({
        title: 'Erro ao atualizar componente',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await updateUsuario(user.id, {
        role,
        can_issue_bidding_proposals: bidding,
        setor: setor.trim(),
        menu_access: access,
      })
      if (currentUser?.id === user.id) {
        await refreshUser()
      }
      toast({ title: 'Permissões atualizadas com sucesso!' })
      onOpenChange(false)
      onSaved()
    } catch (e) {
      toast({
        title: 'Erro ao salvar permissões',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Gerenciar Acessos — {user?.name || user?.email}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Configure as permissões e níveis de acesso do usuário.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Perfil de Acesso</Label>
              <Select value={role} onValueChange={(v: 'admin' | 'user') => handleRoleChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="setor-access">Setor</Label>
              <Input
                id="setor-access"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex: Administrativo, Vendas..."
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Acesso ao Dashboard de Licitação</Label>
                <p className="text-xs text-muted-foreground">
                  Permite emitir e gerenciar propostas de licitação.
                </p>
              </div>
              <Switch checked={bidding} onCheckedChange={setBidding} />
            </div>
          </div>

          {role !== 'admin' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Copy className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-gray-700">Modelos de Permissão</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {PERMISSION_TEMPLATES.map((tpl) => (
                  <Button
                    key={tpl.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(tpl.access)}
                  >
                    {tpl.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {role !== 'admin' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
                Visibilidade de Módulos
              </h3>
              {MENU_ACCESS_GROUPS.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {group.title}
                  </p>
                  {group.keys.map((key) => (
                    <div
                      key={key}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                    >
                      <Label className="text-sm font-normal">{MENU_KEY_LABELS[key]}</Label>
                      <Switch
                        checked={access[key] === true}
                        onCheckedChange={(c) => setAccess((prev) => ({ ...prev, [key]: c }))}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {dashboardConfigs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-gray-700">
                  Componentes do Dashboard ({role === 'admin' ? 'Admin' : 'Usuário'})
                </h3>
              </div>
              {dashboardConfigs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                >
                  <Label className="text-sm font-normal">{cfg.componente}</Label>
                  <Switch
                    checked={cfg.visivel}
                    onCheckedChange={(c) => toggleDashboardConfig(cfg.id, c)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand-success hover:bg-brand-success/90"
          >
            {saving ? 'Salvando...' : 'Salvar Permissões'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
