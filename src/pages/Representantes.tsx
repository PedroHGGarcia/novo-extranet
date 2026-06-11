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
import { getRepresentantes } from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'

export default function Representantes() {
  const [data, setData] = useState<any[]>([])

  const loadData = async () => {
    try {
      const items = await getRepresentantes()
      setData(items)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('representantes', () => {
    loadData()
  })

  const handleEdit = (id: string) => console.log('Editar representante', id)
  const handleDuplicate = (id: string) => console.log('Duplicar representante', id)

  return (
    <PageLayout title="Representantes" icon={Briefcase}>
      <PaginationBar total={data.length} displayTotal={data.length > 0 ? 50 : 0} />
      <div className="overflow-x-auto">
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox />
              </TableHead>
              <SortableHead>Fantasia</SortableHead>
              <SortableHead>Sigla</SortableHead>
              <SortableHead>Telefone</SortableHead>
              <SortableHead>Cidade</SortableHead>
              <SortableHead>UF</SortableHead>
              <SortableHead>Dt. Cad.</SortableHead>
              <SortableHead>Status</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="text-slate-700">{item.fantasia}</div>
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
                <TableCell className="text-slate-600">{item.sigla}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.telefone}</TableCell>
                <TableCell className="text-slate-600">{item.cidade}</TableCell>
                <TableCell className="text-slate-600">{item.uf}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.dt_cad}</TableCell>
                <TableCell>
                  {item.status === 'Ativo' ? (
                    <span className="bg-[#5cb85c] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      Ativo
                    </span>
                  ) : (
                    <span className="bg-slate-400 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {item.status}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PageLayout>
  )
}
