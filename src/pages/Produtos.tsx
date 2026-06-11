import { Package } from 'lucide-react'
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
  { cod: 'M01', desc: 'Torno Mecânico CNC', estoque: 5 },
  { cod: 'M02', desc: 'Fresadora Universal', estoque: 2 },
  { cod: 'M03', desc: 'Serra Fita Automática', estoque: 12 },
]

export default function Produtos() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Controle de Produtos</h1>
      </div>

      <Card className="border-t-4 border-t-brand-cyan shadow-sm rounded-t-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-normal text-gray-700">Estoque Atual</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Estoque</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockData.map((item) => (
                <TableRow key={item.cod}>
                  <TableCell className="font-medium">{item.cod}</TableCell>
                  <TableCell>{item.desc}</TableCell>
                  <TableCell className="text-right">{item.estoque}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
