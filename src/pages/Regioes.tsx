import { Globe, Pencil, Copy, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const mockRegioes = [
  {
    id: 1,
    nome: 'ACRE',
    atualizacao: '18/04/2024 12:14:47',
    autor: 'Gustavo Toloto',
    status: 'Ativo',
  },
  {
    id: 2,
    nome: 'ALAGOAS',
    atualizacao: '18/04/2024 12:16:47',
    autor: 'Gustavo Toloto',
    status: 'Ativo',
  },
  {
    id: 3,
    nome: 'AMAPÁ',
    atualizacao: '18/04/2024 12:17:00',
    autor: 'Gustavo Toloto',
    status: 'Ativo',
  },
  {
    id: 4,
    nome: 'AMAZONAS',
    atualizacao: '21/03/2025 11:14:27',
    autor: 'Pablo Ferreira Silva',
    status: 'Ativo',
  },
  {
    id: 5,
    nome: 'BAHIA',
    atualizacao: '18/04/2024 12:37:46',
    autor: 'Gustavo Toloto',
    status: 'Ativo',
  },
  {
    id: 6,
    nome: 'BRASIL',
    atualizacao: '13/12/2024 11:24:49',
    autor: 'Gustavo Toloto',
    status: 'Ativo',
  },
  {
    id: 7,
    nome: 'CEARA',
    atualizacao: '18/04/2024 12:38:01',
    autor: 'Gustavo Toloto',
    status: 'Ativo',
  },
]

export default function Regioes() {
  const PaginationControl = () => (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className="h-8 w-8 p-0 bg-blue-500 text-white border-blue-500 hover:bg-blue-600 hover:text-white rounded-sm font-normal"
        >
          1
        </Button>
        <span>1–28 de 28</span>
      </div>
      <Select defaultValue="50">
        <SelectTrigger className="h-8 w-[72px] rounded-sm border-gray-300 bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="50">50</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-3 text-gray-800">
        <Globe className="h-6 w-6" />
        <h1 className="text-xl font-semibold">Regiões</h1>
      </div>

      <div className="h-[2px] bg-[#3b82f6] w-full mb-6"></div>

      <div className="flex gap-2 mb-8">
        <Button className="bg-[#3b82f6] hover:bg-blue-600 text-white rounded-sm h-9 px-4 font-normal tracking-wide">
          PESQUISAR
        </Button>
        <Button className="bg-[#3b82f6] hover:bg-blue-600 text-white rounded-sm h-9 px-4 font-normal tracking-wide">
          NOVO
        </Button>
        <Button className="bg-[#3b82f6] hover:bg-blue-600 text-white rounded-sm h-9 px-4 font-normal tracking-wide">
          EXCLUIR
        </Button>
      </div>

      <div className="flex justify-between items-end border-b border-gray-200 mb-0">
        <div className="flex">
          <button className="px-6 py-2.5 bg-white border border-b-0 border-gray-200 border-t-2 border-t-[#3b82f6] text-sm font-medium text-gray-700">
            Registros
          </button>
          <button className="px-6 py-2.5 text-[#3b82f6] text-sm font-medium hover:bg-gray-50/50">
            Cadastro
          </button>
        </div>
        <div className="pb-2">
          <PaginationControl />
        </div>
      </div>

      <div className="bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">
                <Checkbox className="rounded-sm border-gray-300" />
              </TableHead>
              <TableHead className="text-[#3b82f6] font-semibold">
                <div className="flex items-center justify-between">
                  Nome
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
                </div>
              </TableHead>
              <TableHead className="text-[#3b82f6] font-semibold">
                <div className="flex items-center justify-between">
                  Última Atualização
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
                </div>
              </TableHead>
              <TableHead className="text-[#3b82f6] font-semibold">
                <div className="flex items-center justify-between">
                  Atualizado por
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
                </div>
              </TableHead>
              <TableHead className="text-[#3b82f6] font-semibold w-24">
                <div className="flex items-center justify-between">
                  Status
                  <ArrowUpDown className="h-3.5 w-3.5 opacity-50 cursor-pointer" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockRegioes.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50 border-b-gray-100">
                <TableCell className="text-center">
                  <Checkbox className="rounded-sm border-gray-300" />
                </TableCell>
                <TableCell className="py-3">
                  <div className="font-medium text-gray-700">{item.nome}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[#3b82f6] text-xs font-medium">
                    <button className="flex items-center gap-1 hover:underline">
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                    <button className="flex items-center gap-1 hover:underline">
                      <Copy className="h-3 w-3" /> Duplicar
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-gray-600">{item.atualizacao}</TableCell>
                <TableCell className="text-gray-600">{item.autor}</TableCell>
                <TableCell>
                  <span className="bg-[#16a34a] text-white text-[11px] px-2 py-0.5 rounded-sm font-medium tracking-wide">
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end mt-4">
        <PaginationControl />
      </div>
    </div>
  )
}
