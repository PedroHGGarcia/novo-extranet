import { useState, useEffect } from 'react'
import { ShieldCheck, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { getUsuarios, updateUsuario, type Usuario } from '@/services/usuarios'
import { useRealtime } from '@/hooks/use-realtime'
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
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  MENU_ACCESS_GROUPS,
  MENU_KEY_LABELS,
  DEFAULT_USER_ACCESS,
  type MenuAccess,
} from '@/lib/menu-access'

export default function Permissoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [accessData, setAccessData] = useState<MenuAccess>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') loadData()
  }, [user])

  useRealtime('users', () => {
    if (user?.role === 'admin') loadData()
  })

  if (user?.role !== 'admin') return <Navigate to="/" replace />

  const loadData = async () => {
    setLoading(true)
    try {
      setUsuarios(await getUsuarios())
    } catch {
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSheet = (u: Usuario) => {
    setEditingUser(u)
    setAccessData(u.menu_access || { ...DEFAULT_USER_ACCESS })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!editingUser) return
    setSaving(true)
    try {
      await updateUsuario(editingUser.id, { menu_access: accessData })
      toast({ title: 'Permissões atualizadas com sucesso!' })
      setSheetOpen(false)
      loadData()
    } catch {
      toast({ title: 'Erro ao salvar permissões', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const filtered = usuarios.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gray-800">
        <ShieldCheck className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Controle de Permissões</h1>
      </div>

      <Card className="border-t-4 border-t-brand-blue shadow-sm rounded-t-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center gap-4">
            <CardTitle className="text-lg font-normal text-gray-700">Usuários</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9 bg-gray-50 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge className="bg-brand-green hover:bg-brand-green/80">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">Usuário</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleOpenSheet(u)}>
                        Gerenciar Permissões
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Permissões — {editingUser?.name || editingUser?.email}</SheetTitle>
            <SheetDescription className="sr-only">
              Gerencie o acesso aos módulos do sistema.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-6">
            {MENU_ACCESS_GROUPS.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">{group.title}</h3>
                {group.keys.map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                  >
                    <Label className="text-sm font-normal">{MENU_KEY_LABELS[key]}</Label>
                    <Switch
                      checked={accessData[key] === true}
                      onCheckedChange={(c) => setAccessData((prev) => ({ ...prev, [key]: c }))}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-brand-success hover:bg-brand-success/90"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
