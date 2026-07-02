import type { MemoryItem, ConsolidatedSummary } from '@/hooks/use-memoria-calculo'
import { formatBR } from '@/hooks/use-memoria-calculo'

export function exportToCSV(items: MemoryItem[]) {
  const headers = [
    '_01_unidade',
    'descricao_item',
    'quantidade',
    'unidade_medida',
    'preco_custo_unitario',
    'preco_custo_total',
    'desconto_percentual',
    'desconto_valor',
    'preco_com_desconto',
    'comissao_percentual',
    'comissao_valor',
    'markup_percentual',
    'markup_valor',
    'encargos_percentual',
    'encargos_valor',
    'preco_venda_unitario',
    'preco_venda_total',
    'preco_venda_total_secao7',
    'diferenca',
    'status_validacao',
    'observacoes',
  ]
  const rows = items.map((item) =>
    headers
      .map((h) => {
        const val = (item as any)[h]
        if (val == null) return ''
        return typeof val === 'string' && val.includes(';')
          ? `"${val.replace(/"/g, '""')}"`
          : String(val)
      })
      .join(';'),
  )
  const csv = '\uFEFF' + headers.join(';') + '\n' + rows.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'memoria_calculo.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export function printMemoria(items: MemoryItem[], summary: ConsolidatedSummary) {
  const win = window.open('', '_blank')
  if (!win) return

  const sc = (s: string) => (s === 'OK' ? '#16a34a' : s === 'DIVERGENTE' ? '#dc2626' : '#ca8a04')
  const rows = items
    .map(
      (item) => `<tr>
    <td>${item._01_unidade}</td><td>${item.descricao_item || ''}</td>
    <td style="text-align:right">${formatBR(item.quantidade)}</td><td>${item.unidade_medida || ''}</td>
    <td style="text-align:right">${formatBR(item.preco_custo_unitario, 4)}</td>
    <td style="text-align:right">${formatBR(item.preco_custo_total)}</td>
    <td style="text-align:right">${formatBR(item.desconto_percentual)}</td>
    <td style="text-align:right">${formatBR(item.desconto_valor)}</td>
    <td style="text-align:right">${formatBR(item.preco_com_desconto)}</td>
    <td style="text-align:right">${formatBR(item.comissao_percentual)}</td>
    <td style="text-align:right">${formatBR(item.comissao_valor)}</td>
    <td style="text-align:right">${formatBR(item.markup_percentual)}</td>
    <td style="text-align:right">${formatBR(item.markup_valor)}</td>
    <td style="text-align:right">${formatBR(item.encargos_percentual)}</td>
    <td style="text-align:right">${formatBR(item.encargos_valor)}</td>
    <td style="text-align:right">${formatBR(item.preco_venda_unitario, 4)}</td>
    <td style="text-align:right">${formatBR(item.preco_venda_total)}</td>
    <td style="text-align:right">${formatBR(item.preco_venda_total_secao7)}</td>
    <td style="text-align:right">${formatBR(item.diferenca)}</td>
    <td style="text-align:center;background:${sc(item.status_validacao)}20;color:${sc(item.status_validacao)};font-weight:bold">${item.status_validacao}</td>
    <td>${item.observacoes || ''}</td></tr>`,
    )
    .join('')

  const cards = [
    ['Custo Total', summary.total_preco_custo],
    ['Desconto', summary.total_desconto],
    ['Comissão', summary.total_comissao],
    ['Markup', summary.total_markup],
    ['Encargos', summary.total_encargos],
    ['Preço Venda', summary.total_preco_venda],
    ['Diferença', summary.total_diferenca],
  ]
    .map(
      ([l, v]) => `<div class="c"><strong>${l}</strong><span>${formatBR(v as number)}</span></div>`,
    )
    .join('')

  win.document
    .write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Memória de Cálculo</title>
  <style>@page{size:A4 landscape;margin:8mm}body{font-family:Arial,sans-serif;font-size:8px;margin:0}
  h1{font-size:14px;color:#337ab7;margin:0 0 10px}.s{display:flex;gap:8px;margin-bottom:12px}
  .c{padding:6px 10px;border:1px solid #ddd;border-radius:3px}.c strong{display:block;font-size:7px;color:#666}
  .c span{font-size:11px;font-weight:bold;color:#337ab7}table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #ccc;padding:2px 3px;white-space:nowrap}th{background:#f0f0f0;font-weight:bold}</style>
  </head><body><h1>Memória de Cálculo — Proposta de Licitação</h1>
  <div class="s">${cards}</div>
  <table><thead><tr><th>Unid.</th><th>Descrição</th><th>Qtd</th><th>Un.</th><th>Custo Unit.</th><th>Custo Total</th>
  <th>Desc.%</th><th>Desc.Val.</th><th>c/Desc.</th><th>Comiss.%</th><th>Comiss.Val.</th><th>Markup%</th>
  <th>Markup Val.</th><th>Encarg.%</th><th>Encarg.Val.</th><th>Venda Unit.</th><th>Venda Total</th>
  <th>Venda S7</th><th>Dif.</th><th>Status</th><th>Obs.</th></tr></thead><tbody>${rows}</tbody></table>
  </body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 500)
}
