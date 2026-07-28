import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Users, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'
import { getUsuarios, deleteUsuario, type Usuario } from '@/services/usuarios'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { useRealtime } from '@/hooks/use-realtime'
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
import { UserEditSheet } from '@/components/UserEditSheet'
import { UserAccessSheet } from '@/components/UserAccessSheet'

export default function Usuarios() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [accessOpen, setAccessOpen] = useState(false)
  const [accessUser, setAccessUser] = useState<Usuario | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null)

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

  const filtered = usuarios.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenEdit = (u?: Usuario) => {
    setEditingUser(u || null)
    setEditOpen(true)
  }
  const handleOpenAccess = (u: Usuario) => {
    setAccessUser(u)
    setAccessOpen(true)
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-gray-800">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-normal">Gerenciamento de Usuários</h1>
        </div>
        <Button
          onClick={() => handleOpenEdit()}
          className="bg-brand-success hover:bg-brand-success/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Convidar Usuário
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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '-'}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.setor || '-'}</TableCell>
                    <TableCell>
                      {u.role === 'admin' ? (
                        <Badge className="bg-brand-green hover:bg-brand-green/80">Admin</Badge>
                      ) : (
                        <Badge variant="secondary">Usuário</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAccess(u)}
                        className="mr-1 mb-1"
                      >
                        <ShieldCheck className="h-4 w-4 mr-1" />
                        Acessos
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(u)}
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

      <UserEditSheet
        user={editingUser}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={loadData}
      />
      <UserAccessSheet
        user={accessUser}
        open={accessOpen}
        onOpenChange={setAccessOpen}
        onSaved={loadData}
      />

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
