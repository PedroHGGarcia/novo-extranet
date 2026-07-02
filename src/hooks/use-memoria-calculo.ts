import { useMemo } from 'react'

export interface PriceItem {
  _01_unidade: string
  descricao_item: string
  quantidade: number
  unidade_medida: string
  preco_custo_unitario: number
  desconto_percentual: number
  comissao_percentual: number
  markup_percentual: number
  encargos_percentual: number
  preco_venda_total_secao7: number
}

export interface MemoryItem extends PriceItem {
  preco_custo_total: number
  desconto_valor: number
  preco_com_desconto: number
  comissao_valor: number
  markup_valor: number
  encargos_valor: number
  preco_venda_unitario: number
  preco_venda_total: number
  diferenca: number
  status_validacao: 'OK' | 'DIVERGENTE' | 'PENDENTE'
  observacoes: string
  isOrphan: boolean
}

export interface ConsolidatedSummary {
  total_preco_custo: number
  total_desconto: number
  total_comissao: number
  total_markup: number
  total_encargos: number
  total_preco_venda: number
  total_diferenca: number
  count_ok: number
  count_divergente: number
  count_pendente: number
}

const r2 = (n: number) => Math.round(n * 100) / 100
const r4 = (n: number) => Math.round(n * 10000) / 10000

export const formatBR = (n: number, dec = 2) =>
  (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec })

export function calculateMemoryItem(item: PriceItem, observacoes: string): MemoryItem {
  const qtd = item.quantidade || 0
  const custoUnit = item.preco_custo_unitario || 0
  const descPct = item.desconto_percentual || 0
  const comPct = item.comissao_percentual || 0
  const mkPct = item.markup_percentual || 0
  const encPct = item.encargos_percentual || 0

  const preco_custo_total = r2(qtd * custoUnit)
  const desconto_valor = r2(preco_custo_total * (descPct / 100))
  const preco_com_desconto = r2(preco_custo_total - desconto_valor)
  const comissao_valor = r2(preco_com_desconto * (comPct / 100))
  const markup_valor = r2((preco_com_desconto + comissao_valor) * (mkPct / 100))
  const encargos_valor = r2((preco_com_desconto + comissao_valor + markup_valor) * (encPct / 100))
  const preco_venda_total = r2(preco_com_desconto + comissao_valor + markup_valor + encargos_valor)
  const preco_venda_unitario = qtd > 0 ? r4(preco_venda_total / qtd) : 0

  const hasSec7 = item.preco_venda_total_secao7 != null && !isNaN(item.preco_venda_total_secao7)
  const diferenca = hasSec7 ? r2(preco_venda_total - item.preco_venda_total_secao7) : 0

  let status_validacao: 'OK' | 'DIVERGENTE' | 'PENDENTE' = 'PENDENTE'
  if (hasSec7) status_validacao = Math.abs(diferenca) <= 0.01 ? 'OK' : 'DIVERGENTE'

  return {
    ...item,
    preco_custo_total,
    desconto_valor,
    preco_com_desconto,
    comissao_valor,
    markup_valor,
    encargos_valor,
    preco_venda_unitario,
    preco_venda_total,
    diferenca,
    status_validacao,
    observacoes,
    isOrphan: false,
  }
}

export function useMemoriaCalculo(priceItems: PriceItem[], observacoes: Record<string, string>) {
  const memoryItems = useMemo(
    () => priceItems.map((item) => calculateMemoryItem(item, observacoes[item._01_unidade] || '')),
    [priceItems, observacoes],
  )

  const summary = useMemo<ConsolidatedSummary>(() => {
    const init: ConsolidatedSummary = {
      total_preco_custo: 0,
      total_desconto: 0,
      total_comissao: 0,
      total_markup: 0,
      total_encargos: 0,
      total_preco_venda: 0,
      total_diferenca: 0,
      count_ok: 0,
      count_divergente: 0,
      count_pendente: 0,
    }
    return memoryItems.reduce(
      (acc, item) => ({
        total_preco_custo: r2(acc.total_preco_custo + item.preco_custo_total),
        total_desconto: r2(acc.total_desconto + item.desconto_valor),
        total_comissao: r2(acc.total_comissao + item.comissao_valor),
        total_markup: r2(acc.total_markup + item.markup_valor),
        total_encargos: r2(acc.total_encargos + item.encargos_valor),
        total_preco_venda: r2(acc.total_preco_venda + item.preco_venda_total),
        total_diferenca: r2(acc.total_diferenca + item.diferenca),
        count_ok: acc.count_ok + (item.status_validacao === 'OK' ? 1 : 0),
        count_divergente: acc.count_divergente + (item.status_validacao === 'DIVERGENTE' ? 1 : 0),
        count_pendente: acc.count_pendente + (item.status_validacao === 'PENDENTE' ? 1 : 0),
      }),
      init,
    )
  }, [memoryItems])

  return { memoryItems, summary }
}

export function validatePriceItem(item: PriceItem): string[] {
  const errors: string[] = []
  if (item.quantidade <= 0) errors.push('Quantidade deve ser > 0')
  if (item.preco_custo_unitario < 0) errors.push('Custo não pode ser negativo')
  if (item.desconto_percentual < 0 || item.desconto_percentual > 100)
    errors.push('Desconto: 0-100%')
  if (item.comissao_percentual < 0 || item.comissao_percentual > 100)
    errors.push('Comissão: 0-100%')
  if (item.encargos_percentual < 0 || item.encargos_percentual > 100)
    errors.push('Encargos: 0-100%')
  if (item.markup_percentual < 0) errors.push('Markup deve ser ≥ 0')
  return errors
}
