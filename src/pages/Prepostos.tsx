import { useState, useEffect } from 'react'
import { Briefcase, Pencil, Copy } from 'lucide-react'
import { PageLayout } from '@/components/PageLayout'
import { PaginationBar } from '@/components/PaginationBar'
import { SortableHead } from '@/components/SortableHead'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { getPrepostos } from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'

export default function Prepostos() {
  const [data, setData] = useState<any[]>([])

  const loadData = async () => {
    try {
      const items = await getPrepostos()
      setData(items)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('prepostos', () => {
    loadData()
  })

  const handleEdit = (id: string) => console.log('Editar preposto', id)
  const handleDuplicate = (id: string) => console.log('Duplicar preposto', id)

  return (
    <PageLayout title="Prepostos" icon={Briefcase}>
      <PaginationBar total={data.length} displayTotal={data.length > 0 ? 97 : 0} />
      <div className="overflow-x-auto">
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox />
              </TableHead>
              <SortableHead>Representante</SortableHead>
              <SortableHead>Nome</SortableHead>
              <SortableHead>E-mail</SortableHead>
              <SortableHead>Telefone</SortableHead>
              <SortableHead>Dt Cad.</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="text-slate-700">{item.representante}</div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#337ab7]">
                    <button
                      onClick={() => handleEdit(item.id)}
                      className="flex items-center hover:underline"
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Editar
                    </button>
                    <button
                      onClick={() => handleDuplicate(item.id)}
                      className="flex items-center hover:underline"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Duplicar
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600">{item.nome}</TableCell>
                <TableCell className="text-slate-600">{item.email}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.telefone}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.dt_cad}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageLayout>
  )
}
