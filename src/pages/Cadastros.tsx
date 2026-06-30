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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2 text-slate-900 dark:text-slate-50">
        <Contact className="h-6 w-6 text-brand-green" strokeWidth={1.75} />
        <h1 className="text-page-title">Cadastros</h1>
      </div>

      <Card className="border-t-4 border-t-brand-blue dark:border-t-primary shadow-sm rounded-lg overflow-hidden bg-white dark:bg-card">
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-section-title">Listagem Geral</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-table-header">ID</TableHead>
                <TableHead className="text-table-header">Nome</TableHead>
                <TableHead className="text-table-header">Tipo</TableHead>
                <TableHead className="text-table-header">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-border hover:bg-slate-50 dark:hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium text-body">{item.id}</TableCell>
                  <TableCell className="text-body">{item.nome}</TableCell>
                  <TableCell className="text-body">{item.tipo}</TableCell>
                  <TableCell className="text-body">
                    <span
                      className={
                        item.status === 'Ativo'
                          ? 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }
                    >
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
