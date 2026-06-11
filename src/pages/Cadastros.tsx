import { Contact } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const mockData = [
  { id: '1', nome: 'Empresa Alpha Ltda', tipo: 'Cliente', status: 'Ativo' },
  { id: '2', nome: 'Distribuidora Beta', tipo: 'Fornecedor', status: 'Ativo' },
  { id: '3', nome: 'João Silva', tipo: 'Representante', status: 'Inativo' },
]

export default function Cadastros() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Contact className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Cadastros</h1>
      </div>

      <Card className="border-t-4 border-t-brand-blue shadow-sm rounded-t-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-normal text-gray-700">Listagem Geral</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.tipo}</TableCell>
                  <TableCell>
                    <span className={item.status === 'Ativo' ? 'text-green-600' : 'text-red-500'}>
                      {item.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
