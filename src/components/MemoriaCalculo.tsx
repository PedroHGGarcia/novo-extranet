import { useState, useMemo, Fragment } from 'react'
import {
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronRight,
  Search,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  useMemoriaCalculo,
  formatBR,
  type PriceItem,
  type MemoryItem,
} from '@/hooks/use-memoria-calculo'
import { exportToCSV, printMemoria } from '@/lib/memoria-export'

interface MemoriaCalculoProps {
  priceItems: PriceItem[]
  observacoes: Record<string, string>
  onUpdateObservacao: (unidade: string, obs: string) => void
}

const COLS: Array<{ key: string; label: string; dec: number }> = [
  { key: '_01_unidade', label: 'Unid.', dec: -1 },
  { key: 'descricao_item', label: 'Descrição', dec: -1 },
  { key: 'quantidade', label: 'Qtd', dec: 2 },
  { key: 'unidade_medida', label: 'Un.', dec: -1 },
  { key: 'preco_custo_unitario', label: 'Custo Unit.', dec: 4 },
  { key: 'preco_custo_total', label: 'Custo Total', dec: 2 },
  { key: 'desconto_percentual', label: 'Desc.%', dec: 2 },
  { key: 'desconto_valor', label: 'Desc.Val.', dec: 2 },
  { key: 'preco_com_desconto', label: 'c/Desc.', dec: 2 },
  { key: 'comissao_percentual', label: 'Comiss.%', dec: 2 },
  { key: 'comissao_valor', label: 'Comiss.Val.', dec: 2 },
  { key: 'markup_percentual', label: 'Markup%', dec: 2 },
  { key: 'markup_valor', label: 'Markup Val.', dec: 2 },
  { key: 'encargos_percentual', label: 'Encarg.%', dec: 2 },
  { key: 'encargos_valor', label: 'Encarg.Val.', dec: 2 },
  { key: 'preco_venda_unitario', label: 'Venda Unit.', dec: 4 },
  { key: 'preco_venda_total', label: 'Venda Total', dec: 2 },
  { key: 'preco_venda_total_secao7', label: 'Venda S7', dec: 2 },
  { key: 'diferenca', label: 'Dif.', dec: 2 },
]

const statusStyles: Record<string, string> = {
  OK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DIVERGENTE: 'bg-rose-50 text-rose-700 border-rose-200',
  PENDENTE: 'bg-amber-50 text-amber-700 border-amber-200',
}

export function MemoriaCalculo({
  priceItems,
  observacoes,
  onUpdateObservacao,
}: MemoriaCalculoProps) {
  const { memoryItems, summary } = useMemoriaCalculo(priceItems, observacoes)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const filtered = useMemo(
    () =>
      memoryItems.filter((item) => {
        const s = search.toLowerCase()
        const ms =
          !s ||
          item._01_unidade.toLowerCase().includes(s) ||
          item.descricao_item.toLowerCase().includes(s)
        const mf = filterStatus === 'all' || item.status_validacao === filterStatus
        return ms && mf
      }),
    [memoryItems, search, filterStatus],
  )

  const toggle = (k: string) => {
    const n = new Set(expanded)
    n.has(k) ? n.delete(k) : n.add(k)
    setExpanded(n)
  }

  const cards = [
    { l: 'Custo Total', v: summary.total_preco_custo },
    { l: 'Desconto', v: summary.total_desconto },
    { l: 'Comissão', v: summary.total_comissao },
    { l: 'Markup', v: summary.total_markup },
    { l: 'Encargos', v: summary.total_encargos },
    { l: 'Preço Venda', v: summary.total_preco_venda },
    { l: 'Diferença', v: summary.total_diferenca },
  ]

  const renderDetail = (item: MemoryItem) => (
    <tr className="bg-slate-50/50">
      <td colSpan={COLS.length + 3} className="py-3 px-4">
        <div className="flex gap-6">
          <div className="flex flex-col gap-1 text-xs text-slate-600 flex-1">
            <span>
              1. Custo Total = {formatBR(item.quantidade)} ×{' '}
              {formatBR(item.preco_custo_unitario, 4)} = <b>{formatBR(item.preco_custo_total)}</b>
            </span>
            <span>
              2. Desconto = {formatBR(item.preco_custo_total)} ×{' '}
              {formatBR(item.desconto_percentual)}% = <b>{formatBR(item.desconto_valor)}</b>
            </span>
            <span>
              3. c/ Desc. = {formatBR(item.preco_custo_total)} − {formatBR(item.desconto_valor)} ={' '}
              <b>{formatBR(item.preco_com_desconto)}</b>
            </span>
            <span>
              4. Comissão = {formatBR(item.preco_com_desconto)} ×{' '}
              {formatBR(item.comissao_percentual)}% = <b>{formatBR(item.comissao_valor)}</b>
            </span>
            <span>
              5. Markup = ({formatBR(item.preco_com_desconto)} + {formatBR(item.comissao_valor)}) ×{' '}
              {formatBR(item.markup_percentual)}% = <b>{formatBR(item.markup_valor)}</b>
            </span>
            <span>
              6. Encargos = ({formatBR(item.preco_com_desconto)} + {formatBR(item.comissao_valor)} +{' '}
              {formatBR(item.markup_valor)}) × {formatBR(item.encargos_percentual)}% ={' '}
              <b>{formatBR(item.encargos_valor)}</b>
            </span>
            <span>
              7. Venda = {formatBR(item.preco_com_desconto)} + {formatBR(item.comissao_valor)} +{' '}
              {formatBR(item.markup_valor)} + {formatBR(item.encargos_valor)} ={' '}
              <b className="text-[#337ab7]">{formatBR(item.preco_venda_total)}</b>
            </span>
            {item.quantidade > 0 && (
              <span>
                8. Unit. = {formatBR(item.preco_venda_total)} ÷ {formatBR(item.quantidade)} ={' '}
                <b>{formatBR(item.preco_venda_unitario, 4)}</b>
              </span>
            )}
            <span>
              9. Diferença = {formatBR(item.preco_venda_total)} −{' '}
              {formatBR(item.preco_venda_total_secao7)} ={' '}
              <b className={item.diferenca !== 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {formatBR(item.diferenca)}
              </b>
            </span>
          </div>
          <div className="w-64">
            <textarea
              className="w-full bg-white border border-slate-300 rounded-sm px-2 py-1 text-xs text-slate-700 outline-none focus:border-[#337ab7] min-h-[100px] resize-y"
              placeholder="Observações..."
              value={item.observacoes}
              onChange={(e) => onUpdateObservacao(item._01_unidade, e.target.value)}
            />
          </div>
        </div>
      </td>
    </tr>
  )

  const orphanKeys = Object.keys(observacoes).filter(
    (k) => !priceItems.some((p) => p._01_unidade === k),
  )

  return (
    <section>
      <h2 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">
        Seção 12 — Memória de Cálculo
      </h2>
      {orphanKeys.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 mb-2">
          <AlertTriangle className="h-3.5 w-3.5" /> Item órfão — sem correspondência na Seção 7:{' '}
          {orphanKeys.join(', ')}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-2 mb-3">
        {cards.map((c) => (
          <div key={c.l} className="border border-slate-200 rounded-sm p-2 bg-slate-50/50">
            <p className="text-[10px] text-slate-500 font-medium">{c.l}</p>
            <p className="text-sm font-bold text-[#337ab7]">{formatBR(c.v)}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mb-3 text-xs">
        <span className="flex items-center gap-1 text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> OK: {summary.count_ok}
        </span>
        <span className="flex items-center gap-1 text-rose-700">
          <span className="w-2 h-2 rounded-full bg-rose-500" /> Divergente:{' '}
          {summary.count_divergente}
        </span>
        <span className="flex items-center gap-1 text-amber-700">
          <span className="w-2 h-2 rounded-full bg-amber-500" /> Pendente: {summary.count_pendente}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            className="w-full bg-white border border-slate-300 rounded-sm pl-7 pr-2 py-1.5 text-xs outline-none focus:border-[#337ab7]"
            placeholder="Buscar por unidade ou descrição..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-white border border-slate-300 rounded-sm px-2 py-1.5 text-xs outline-none focus:border-[#337ab7]"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="OK">OK</option>
          <option value="DIVERGENTE">Divergente</option>
          <option value="PENDENTE">Pendente</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(memoryItems)}
          className="gap-1 text-xs h-8"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Exportar Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => printMemoria(memoryItems, summary)}
          className="gap-1 text-xs h-8"
        >
          <Printer className="h-3.5 w-3.5" /> Exportar PDF / Imprimir
        </Button>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-sm">
        <table className="w-full text-left text-xs bg-white border-collapse min-w-[2000px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-2 px-2 w-8"></th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    'py-2 px-2 font-normal text-slate-600 whitespace-nowrap',
                    c.dec >= 0 && 'text-right',
                  )}
                >
                  {c.label}
                </th>
              ))}
              <th className="py-2 px-2 font-normal text-slate-600 text-center w-20">Status</th>
              <th className="py-2 px-2 font-normal text-slate-600 min-w-[120px]">Observações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={COLS.length + 3} className="py-6 text-center text-slate-400">
                  {memoryItems.length === 0
                    ? 'Nenhum item na Seção 7. Adicione itens para ver a memória de cálculo.'
                    : 'Nenhum item corresponde aos filtros.'}
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <Fragment key={item._01_unidade}>
                  <tr className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-1.5 px-2 text-center">
                      <button
                        onClick={() => toggle(item._01_unidade)}
                        className="text-slate-400 hover:text-slate-700"
                      >
                        {expanded.has(item._01_unidade) ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </td>
                    {COLS.map((c) => (
                      <td
                        key={c.key}
                        className={cn(
                          'py-1.5 px-2 whitespace-nowrap',
                          c.dec >= 0 ? 'text-right text-slate-600' : 'text-slate-700',
                        )}
                      >
                        {c.dec < 0
                          ? (item as any)[c.key] || '-'
                          : formatBR((item as any)[c.key] || 0, c.dec)}
                      </td>
                    ))}
                    <td className="py-1.5 px-2 text-center">
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border',
                          statusStyles[item.status_validacao],
                        )}
                      >
                        {item.status_validacao}
                      </span>
                    </td>
                    <td
                      className="py-1.5 px-2 text-slate-500 max-w-[120px] truncate"
                      title={item.observacoes}
                    >
                      {item.observacoes || '-'}
                    </td>
                  </tr>
                  {expanded.has(item._01_unidade) && renderDetail(item)}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
