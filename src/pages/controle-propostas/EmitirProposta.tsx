import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Pencil, Printer, FileText } from 'lucide-react'
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

  const renderPagination = () => {
    const totalPages = Math.ceil(totalItems / perPage) || 1
    const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
    const start = totalItems === 0 ? 0 : (page - 1) * perPage + 1
    const end = Math.min(page * perPage, totalItems)

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between w-full py-2 bg-white gap-2">
        <div className="flex items-center space-x-2">
          <Button className="bg-[#1e61b0] hover:bg-[#1e61b0]/90 text-white rounded-sm px-4 py-1 h-8 text-xs font-semibold shadow-none">
            PESQUISAR
          </Button>
          <Button className="bg-[#1e61b0] hover:bg-[#1e61b0]/90 text-white rounded-sm px-4 py-1 h-8 text-xs font-semibold shadow-none">
            EXCLUIR
          </Button>
          <Button className="bg-[#1e61b0] hover:bg-[#1e61b0]/90 text-white rounded-sm px-4 py-1 h-8 text-xs font-semibold shadow-none">
            ALTERAR NOTA
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-2.5 py-1 text-xs rounded-sm ${
                  p === page ? 'bg-[#3b82f6] text-white' : 'text-[#3b82f6] hover:bg-blue-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 text-[#3b82f6] hover:bg-blue-50 text-xs rounded-sm"
              disabled={page === totalPages}
            >
              ›
            </button>
          </div>
          <div className="text-xs text-gray-500 flex items-center space-x-2">
            <span>
              {start}-{end} de {totalItems.toLocaleString('pt-BR')}
            </span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
              className="border rounded-sm text-xs px-1 py-1 border-gray-300 bg-white"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  const renderSortableHead = (label: string) => (
    <TableHead className="text-[#3b82f6] font-medium text-xs whitespace-nowrap bg-white border-r last:border-r-0">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-gray-300 ml-1 leading-none inline-flex flex-col text-[10px]">
          <span>▲</span>
          <span className="-mt-1">▼</span>
        </span>
      </div>
    </TableHead>
  )

  return (
    <div className="flex flex-col h-full bg-white text-gray-800">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-gray-700">
        <Printer className="h-5 w-5 text-gray-600" />
        <h1 className="text-lg font-semibold tracking-tight">Emitir Proposta</h1>
      </div>

      <div className="px-4 pt-2 flex-1 flex flex-col">
        <Tabs defaultValue="registros" className="w-full flex-1 flex flex-col">
          <TabsList className="bg-transparent border-b border-gray-200 w-full justify-start rounded-none h-auto p-0 space-x-6">
            <TabsTrigger
              value="registros"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:text-[#3b82f6] data-[state=active]:font-semibold data-[state=active]:shadow-none px-0 py-2 text-sm bg-transparent"
            >
              Registros
            </TabsTrigger>
            <TabsTrigger
              value="cadastro"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:text-[#3b82f6] data-[state=active]:font-semibold data-[state=active]:shadow-none px-0 py-2 text-sm bg-transparent text-gray-500"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="registros" className="mt-0 outline-none flex-1 flex flex-col">
            {renderPagination()}

            <div className="border border-gray-200 rounded-sm overflow-x-auto flex-1 bg-white">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="border-b border-gray-200">
                    <TableHead className="w-[40px] text-center border-r bg-white p-2">
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
                        className="hover:bg-blue-50/50 border-b border-gray-100"
                      >
                        <TableCell className="text-center border-r align-top py-2">
                          <Checkbox />
                        </TableCell>
                        <TableCell className="border-r align-top py-2 min-w-[120px]">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.numero_proposta}</span>
                            <div className="flex items-center text-[11px] text-[#3b82f6] mt-1.5 gap-2">
                              <button className="flex items-center gap-1 hover:underline">
                                <Pencil className="h-3 w-3" /> Editar
                              </button>
                              <button className="flex items-center gap-1 hover:underline">
                                <Printer className="h-3 w-3" /> Visualizar
                              </button>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell
                          className="border-r align-top py-2 text-gray-600 max-w-[200px] truncate"
                          title={
                            item.expand?.cliente?.razao_social || item.expand?.cliente?.fantasia
                          }
                        >
                          {item.expand?.cliente?.razao_social ||
                            item.expand?.cliente?.fantasia ||
                            '-'}
                        </TableCell>
                        <TableCell className="border-r align-top py-2 text-gray-600 uppercase">
                          {item.contato || '-'}
                        </TableCell>
                        <TableCell className="border-r align-top py-2 text-gray-600 whitespace-nowrap">
                          {item.telefone || '-'}
                        </TableCell>
                        <TableCell
                          className="border-r align-top py-2 text-gray-600 max-w-[250px] uppercase truncate"
                          title={item.expand?.versao?.nome}
                        >
                          {item.expand?.versao?.nome || '-'}
                        </TableCell>
                        <TableCell className="border-r align-top py-2 text-gray-600 uppercase">
                          {item.expand?.representante?.fantasia || '-'}
                        </TableCell>
                        <TableCell className="border-r align-top py-2 text-gray-600 text-center">
                          {item.nota_rep || '-'}
                        </TableCell>
                        <TableCell className="border-r align-top py-2 text-gray-600 whitespace-nowrap">
                          {item.dt_cad ? format(new Date(item.dt_cad), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="align-top py-2 text-gray-600 uppercase">
                          {item.expand?.user?.name || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {renderPagination()}
          </TabsContent>

          <TabsContent value="cadastro">
            <div className="p-8 text-sm text-gray-500 bg-white border border-gray-200 rounded-sm mt-4 text-center">
              A interface de cadastro será implementada na próxima iteração.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
