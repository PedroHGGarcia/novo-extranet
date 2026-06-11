import { FileText } from 'lucide-react'
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
  { id: '1024', cliente: 'Indústria Mega', valor: 'R$ 150.000,00', status: 'Aprovada' },
  { id: '1025', cliente: 'Comercial Souza', valor: 'R$ 45.500,00', status: 'Em Análise' },
]

export default function Propostas() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Controle de Propostas</h1>
      </div>

      <Card className="border-t-4 border-t-brand-orange shadow-sm rounded-t-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-normal text-gray-700">Últimas Propostas</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell>{item.cliente}</TableCell>
                  <TableCell>{item.valor}</TableCell>
                  <TableCell>{item.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
