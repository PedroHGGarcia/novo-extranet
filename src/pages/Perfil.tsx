import { UserCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Perfil() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <UserCircle className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Perfil</h1>
      </div>

      <Card className="border-t-4 border-t-brand-success shadow-sm rounded-t-sm max-w-2xl">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-normal text-gray-700">Meus Dados</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input id="nome" defaultValue="Administrador BENER" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" defaultValue="admin@bener.com.br" />
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t pt-4">
          <Button className="bg-brand-success hover:bg-brand-success/90 font-medium px-8 text-xs h-9 rounded-sm">
            ATUALIZAR PERFIL
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
