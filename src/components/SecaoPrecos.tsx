import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PriceItem } from '@/hooks/use-memoria-calculo'

interface SecaoPrecosProps {
  items: PriceItem[]
  onAdd: () => void
  onUpdate: (index: number, field: keyof PriceItem, value: any) => void
  onRemove: (index: number) => void
}

const inputCls =
  'w-full bg-white border border-slate-300 rounded-sm px-1.5 py-1 outline-none text-slate-700 text-xs focus:border-[#337ab7] min-h-[28px]'
const numCls = inputCls + ' text-right'

export function SecaoPrecos({ items, onAdd, onUpdate, onRemove }: SecaoPrecosProps) {
  return (
    <section>
      <h2 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">
        Seção 7 — Preços
      </h2>
      <div className="overflow-x-auto border border-slate-200 rounded-sm">
        <table className="w-full text-left text-xs bg-white border-collapse min-w-[1100px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="py-2 px-2 font-normal text-slate-600 w-16">Unidade</th>
              <th className="py-2 px-2 font-normal text-slate-600 min-w-[140px]">Descrição</th>
              <th className="py-2 px-2 font-normal text-slate-600 w-20">Qtd</th>
              <th className="py-2 px-2 font-normal text-slate-600 w-14">Un.</th>
              <th className="py-2 px-2 font-normal text-slate-600 w-24">Custo Unit.</th>
              <th className="py-2 px-2 font-normal text-slate-600 w-20">Desc.%</th>
              <th className="py-2 px-2 font-normal text-slate-600 w-20">Comiss.%</th>
              <th className="py-2 px-2 font-normal text-slate-600 w-20">Markup%</th>
              <th className="py-2 px-2 font-normal text-slate-600 w-20">Encarg.%</th>
              <th className="py-2 px-2 font-normal text-slate-600 w-28">Venda Total (S7)</th>
              <th className="py-2 px-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-6 text-center text-slate-400">
                  Nenhum item adicionado. Clique em &quot;Adicionar Item&quot; para começar.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="py-1 px-1">
                    <input
                      className={inputCls}
                      value={item._01_unidade}
                      onChange={(e) => onUpdate(idx, '_01_unidade', e.target.value)}
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      className={inputCls}
                      value={item.descricao_item}
                      placeholder="Descrição..."
                      onChange={(e) => onUpdate(idx, 'descricao_item', e.target.value)}
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={cn(numCls, item.quantidade <= 0 && 'border-rose-400')}
                      value={item.quantidade}
                      onChange={(e) => onUpdate(idx, 'quantidade', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      className={inputCls}
                      value={item.unidade_medida}
                      onChange={(e) => onUpdate(idx, 'unidade_medida', e.target.value)}
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      className={cn(numCls, item.preco_custo_unitario < 0 && 'border-rose-400')}
                      value={item.preco_custo_unitario}
                      onChange={(e) =>
                        onUpdate(idx, 'preco_custo_unitario', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className={cn(numCls, item.desconto_percentual > 100 && 'border-rose-400')}
                      value={item.desconto_percentual}
                      onChange={(e) =>
                        onUpdate(idx, 'desconto_percentual', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className={numCls}
                      value={item.comissao_percentual}
                      onChange={(e) =>
                        onUpdate(idx, 'comissao_percentual', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={numCls}
                      value={item.markup_percentual}
                      onChange={(e) =>
                        onUpdate(idx, 'markup_percentual', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      className={numCls}
                      value={item.encargos_percentual}
                      onChange={(e) =>
                        onUpdate(idx, 'encargos_percentual', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={numCls + ' font-semibold text-[#337ab7]'}
                      value={item.preco_venda_total_secao7}
                      onChange={(e) =>
                        onUpdate(idx, 'preco_venda_total_secao7', parseFloat(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="py-1 px-1 text-center">
                    <button
                      onClick={() => onRemove(idx)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded p-1 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="gap-2 w-fit mt-3 text-[#337ab7] border-[#337ab7] hover:bg-[#337ab7] hover:text-white"
      >
        <Plus className="h-4 w-4" /> Adicionar Item
      </Button>
    </section>
  )
}
