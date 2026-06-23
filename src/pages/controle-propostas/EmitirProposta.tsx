import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Pencil, Printer } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPropostasPaginated, type Proposta } from '@/services/propostas'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

export default function EmitirProposta() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [data, setData] = useState<Proposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const res = await getPropostasPaginated(page, perPage)
      setData(res.items)
      setTotalItems(res.totalItems)
    } catch (error) {
      console.error('Failed to load propostas', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, perPage])

  useRealtime('propostas', () => {
    loadData()
  })

  const renderTopPagination = () => {
    const totalPages = Math.ceil(totalItems / perPage) || 1
    const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
    const start = totalItems === 0 ? 0 : (page - 1) * perPage + 1
    const end = Math.min(page * perPage, totalItems)

    return (
      <div className="flex items-center text-sm text-gray-600 gap-4">
        <div className="flex items-center">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'px-3 py-1.5 min-w-[32px] text-center text-xs',
                p === page ? 'bg-[#3b82f6] text-white' : 'text-[#3b82f6] hover:bg-gray-100',
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1.5 text-[#3b82f6] hover:bg-gray-100 font-bold"
            disabled={page === totalPages}
          >
            ›
          </button>
        </div>
        <div className="text-xs flex items-center gap-3">
          <span>
            {start}-{end} de {totalItems.toLocaleString('pt-BR')}
          </span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setPage(1)
            }}
            className="border border-gray-300 rounded text-xs px-2 py-1 outline-none focus:border-[#3b82f6]"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    )
  }

  const renderSortableHead = (label: string) => (
    <TableHead className="text-[#3b82f6] font-medium text-[13px] whitespace-nowrap bg-white border-b py-3">
      <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
        <span>{label}</span>
        <span className="text-gray-300 leading-none inline-flex flex-col text-[10px]">
          <span>▲</span>
          <span className="-mt-[2px]">▼</span>
        </span>
      </div>
    </TableHead>
  )

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 p-6 pt-4">
      <Tabs defaultValue="registros" className="w-full flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-end border-b border-gray-200">
          <TabsList className="bg-transparent justify-start rounded-none h-auto p-0 space-x-6">
            <TabsTrigger
              value="registros"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:text-[#3b82f6] data-[state=active]:font-semibold data-[state=active]:shadow-none px-2 py-2 text-sm bg-transparent"
            >
              Registros
            </TabsTrigger>
            <TabsTrigger
              value="cadastro"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:text-[#3b82f6] data-[state=active]:font-semibold data-[state=active]:shadow-none px-2 py-2 text-sm bg-transparent text-gray-500"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>

          <div className="pb-2">{renderTopPagination()}</div>
        </div>

        <TabsContent
          value="registros"
          className="mt-0 outline-none flex-1 flex flex-col min-h-0 pt-4"
        >
          <div className="border border-gray-200 overflow-y-auto flex-1 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 hover:bg-transparent">
                  <TableHead className="w-[40px] text-center bg-white border-b p-2">
                    <Checkbox />
                  </TableHead>
                  {renderSortableHead('Proposta')}
                  {renderSortableHead('Razão Social')}
                  {renderSortableHead('Contato')}
                  {renderSortableHead('Telefone')}
                  {renderSortableHead('Versão')}
                  {renderSortableHead('Representante')}
                  {renderSortableHead('Nota Rep.')}
                  {renderSortableHead('Dt. Cad')}
                  {renderSortableHead('Por')}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Nenhuma proposta encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow
                      key={item.id}
                      className="hover:bg-gray-50/50 border-b border-gray-100"
                    >
                      <TableCell className="align-top py-4 text-center">
                        <Checkbox />
                      </TableCell>
                      <TableCell className="align-top py-4 min-w-[120px]">
                        <div className="font-medium text-gray-700 text-xs">
                          {item.numero_proposta}
                        </div>
                        <div className="flex flex-col mt-1.5 gap-1.5">
                          <button className="flex items-center text-[#3b82f6] hover:underline text-[11px]">
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </button>
                          <button className="flex items-center text-[#3b82f6] hover:underline text-[11px]">
                            <Printer className="h-3 w-3 mr-1" /> Visualizar
                          </button>
                        </div>
                      </TableCell>
                      <TableCell
                        className="align-top py-4 text-gray-600 text-xs uppercase max-w-[200px] truncate"
                        title={item.expand?.cliente?.razao_social || item.expand?.cliente?.fantasia}
                      >
                        {item.expand?.cliente?.razao_social ||
                          item.expand?.cliente?.fantasia ||
                          '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs">
                        {item.contato || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs whitespace-nowrap">
                        {item.telefone || '-'}
                      </TableCell>
                      <TableCell
                        className="align-top py-4 text-gray-600 text-xs uppercase max-w-[300px] whitespace-normal leading-relaxed"
                        title={item.expand?.versao?.nome}
                      >
                        {item.expand?.versao?.nome || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs uppercase">
                        {item.expand?.representante?.fantasia || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs text-center">
                        {item.nota_rep || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs whitespace-nowrap">
                        {item.dt_cad ? format(new Date(item.dt_cad), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs uppercase">
                        {item.expand?.user?.name || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-2">
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-sm px-6 py-2 h-9 text-[11px] font-semibold tracking-wider shadow-none">
              PESQUISAR
            </Button>
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-sm px-6 py-2 h-9 text-[11px] font-semibold tracking-wider shadow-none">
              EXCLUIR
            </Button>
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-sm px-6 py-2 h-9 text-[11px] font-semibold tracking-wider shadow-none">
              ALTERAR NOTA
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="cadastro">
          <div className="p-8 text-sm text-gray-500 bg-white border border-gray-200 rounded-sm mt-4 text-center">
            A interface de cadastro será implementada na próxima iteração.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
