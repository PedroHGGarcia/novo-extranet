import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Users, Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  type Usuario,
} from '@/services/usuarios'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { inviteUser } from '@/services/config'

export default function Usuarios() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    confirmEmail: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    can_issue_bidding_proposals: false,
    setor: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteData, setInviteData] = useState({ email: '', role: 'user' as 'admin' | 'user' })
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
    }
  }, [user])

  useRealtime('users', () => {
    if (user?.role === 'admin') {
      loadData()
    }
  })

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await getUsuarios()
      setUsuarios(data)
    } catch (e) {
      toast({ title: 'Erro ao carregar usuários', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenSheet = (u?: Usuario) => {
    if (u) {
      setEditingUser(u)
      setFormData({
        name: u.name || '',
        email: u.email,
        confirmEmail: u.email,
        password: '',
        role: u.role || 'user',
        can_issue_bidding_proposals: u.can_issue_bidding_proposals || false,
        setor: u.setor || '',
      })
    } else {
      setEditingUser(null)
      setFormData({
        name: '',
        email: '',
        confirmEmail: '',
        password: '',
        role: 'user',
        can_issue_bidding_proposals: false,
        setor: '',
      })
    }
    setErrors({})
    setSheetOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setErrors({})

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Formato de e-mail inválido'
    }
    if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = 'Os e-mails não coincidem'
    }
    if (!editingUser && !formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'A senha deve ter no mínimo 8 caracteres'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setSaving(false)
      return
    }

    try {
      const payload: Record<string, any> = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        can_issue_bidding_proposals: formData.can_issue_bidding_proposals,
        setor: formData.setor.trim(),
      }

      if (formData.password) {
        payload.password = formData.password
        payload.passwordConfirm = formData.password
      }

      if (editingUser) {
        await updateUsuario(editingUser.id, payload)
        toast({ title: 'Usuário atualizado com sucesso!' })
      } else {
        await createUsuario(payload)
        toast({ title: 'Usuário criado com sucesso!' })
      }
      setSheetOpen(false)
      loadData()
    } catch (e: any) {
      const fieldErrors = extractFieldErrors(e)
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      } else {
        toast({
          title: 'Erro ao salvar usuário',
          description: getErrorMessage(e),
          variant: 'destructive',
        })
      }
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (u: Usuario) => {
    setUserToDelete(u)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    try {
      await deleteUsuario(userToDelete.id)
      toast({ title: 'Usuário removido com sucesso' })
      loadData()
    } catch (e) {
      toast({
        title: 'Erro ao remover usuário',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleToggleBidding = async (u: Usuario) => {
    try {
      await updateUsuario(u.id, {
        can_issue_bidding_proposals: !u.can_issue_bidding_proposals,
      })
      toast({
        title: !u.can_issue_bidding_proposals
          ? 'Permissão de licitação concedida'
          : 'Permissão de licitação removida',
      })
      loadData()
    } catch (e) {
      toast({
        title: 'Erro ao atualizar permissão',
        description: getErrorMessage(e),
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-gray-800">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-normal">Gerenciamento de Usuários</h1>
        </div>
        <Button
          onClick={() => handleOpenSheet()}
          className="bg-brand-success hover:bg-brand-success/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card className="border-t-4 border-t-brand-success shadow-sm rounded-t-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-normal text-gray-700">
              Usuários Cadastrados
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
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
                <TableHead>Setor</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Emitir Licitação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.setor || '-'}</TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge variant="default" className="bg-brand-green hover:bg-brand-green/80">
                          <Shield className="mr-1 h-3 w-3" /> Admin
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Usuário</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.can_issue_bidding_proposals || false}
                        onCheckedChange={() => handleToggleBidding(u)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenSheet(u)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(u)}
                        disabled={u.id === user?.id}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
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
            <SheetTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</SheetTitle>
            <SheetDescription className="sr-only">
              Preencha os dados abaixo para {editingUser ? 'editar o' : 'criar um novo'} usuário.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) setErrors({ ...errors, email: '' })
                }}
                className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmEmail">Confirmar E-mail</Label>
              <Input
                id="confirmEmail"
                type="email"
                value={formData.confirmEmail}
                onChange={(e) => {
                  setFormData({ ...formData, confirmEmail: e.target.value })
                  if (errors.confirmEmail) setErrors({ ...errors, confirmEmail: '' })
                }}
                className={errors.confirmEmail ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.confirmEmail && (
                <span className="text-xs text-red-500">{errors.confirmEmail}</span>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">
                Senha{' '}
                {editingUser && (
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="setor">Setor</Label>
              <Input
                id="setor"
                value={formData.setor}
                onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                placeholder="Ex: Administrativo, Vendas, Técnico..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Perfil de Acesso</Label>
              <Select
                value={formData.role}
                onValueChange={(val: 'admin' | 'user') => setFormData({ ...formData, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário Padrão</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <span className="text-xs text-red-500">{errors.role}</span>}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Permitir emissão de propostas de licitação</Label>
                <p className="text-xs text-muted-foreground">
                  Permite ao usuário criar e gerenciar propostas de licitação.
                </p>
              </div>
              <Switch
                checked={formData.can_issue_bidding_proposals}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, can_issue_bidding_proposals: checked })
                }
              />
            </div>
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

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
            <DialogDescription className="sr-only">
              Envie um convite para um novo usuário acessar o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>E-mail do convidado</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Perfil</Label>
              <Select
                value={inviteData.role}
                onValueChange={(val: 'admin' | 'user') =>
                  setInviteData({ ...inviteData, role: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário Padrão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={inviting}
              onClick={async () => {
                if (!inviteData.email) return
                setInviting(true)
                try {
                  await inviteUser(inviteData.email, inviteData.role)
                  toast({ title: 'Convite enviado com sucesso!' })
                  setInviteOpen(false)
                  setInviteData({ email: '', role: 'user' })
                  loadData()
                } catch (e: any) {
                  toast({
                    title: 'Erro ao enviar convite',
                    description: getErrorMessage(e),
                    variant: 'destructive',
                  })
                } finally {
                  setInviting(false)
                }
              }}
              className="bg-brand-success hover:bg-brand-success/90"
            >
              {inviting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o usuário{' '}
              <strong>{userToDelete?.name || userToDelete?.email}</strong>? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
