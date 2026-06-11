import { Search, Plus, Pencil, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const mockClientes = [
  {
    id: '1',
    nome: 'Indústria Metalúrgica Alfa',
    documento: '12.345.678/0001-90',
    cidade: 'São Paulo/SP',
    status: 'Ativo',
  },
  {
    id: '2',
    nome: 'Torno & Cia Usinagem',
    documento: '98.765.432/0001-10',
    cidade: 'Campinas/SP',
    status: 'Ativo',
  },
  {
    id: '3',
    nome: 'Mecânica Precisa Beta',
    documento: '45.678.901/0001-23',
    cidade: 'Belo Horizonte/MG',
    status: 'Inativo',
  },
  {
    id: '4',
    nome: 'Ferramentaria XYZ',
    documento: '33.444.555/0001-66',
    cidade: 'Joinville/SC',
    status: 'Ativo',
  },
  {
    id: '5',
    nome: 'Usinagem Industrial Delta',
    documento: '77.888.999/0001-00',
    cidade: 'Curitiba/PR',
    status: 'Ativo',
  },
  {
    id: '6',
    nome: 'Peças Automotivas Ômega',
    documento: '11.222.333/0001-44',
    cidade: 'Caxias do Sul/RS',
    status: 'Inativo',
  },
]

export default function Clientes() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
      </div>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 items-center space-x-2 w-full sm:w-auto">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar clientes..."
                className="w-full pl-8 bg-background"
              />
            </div>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Novo Cliente
          </Button>
        </div>
        <div className="rounded-md border bg-background overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClientes.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium whitespace-nowrap">{cliente.nome}</TableCell>
                    <TableCell className="whitespace-nowrap">{cliente.documento}</TableCell>
                    <TableCell className="whitespace-nowrap">{cliente.cidade}</TableCell>
                    <TableCell>
                      <Badge variant={cliente.status === 'Ativo' ? 'default' : 'secondary'}>
                        {cliente.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Duplicar">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
