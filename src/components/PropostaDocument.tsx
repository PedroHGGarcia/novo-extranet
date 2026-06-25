import { type Proposta } from '@/services/propostas'
import { type TipoProposta } from '@/services/tipos-propostas'
import benerLogoUrl from '@/assets/bener-thumb-c5c1b.png'

export const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
  if (value === undefined) return '-'
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'US$' ? 'USD' : currency || 'BRL',
    }).format(value)
  } catch (e) {
    return `${currency} ${value}`
  }
}

interface PropostaDocumentProps {
  proposta: Partial<Proposta>
  tipoProposta?: TipoProposta | null
  clienteNome: string
  representanteNome: string
  versaoNome: string
  gerenteNome: string
  acessorios: any[]
}

export function PropostaDocument({
  proposta,
  tipoProposta,
  clienteNome,
  representanteNome,
  versaoNome,
  gerenteNome,
  acessorios,
}: PropostaDocumentProps) {
  return (
    <div className="bg-white text-slate-800 font-sans text-[13px] leading-relaxed w-[210mm] max-w-full min-h-[297mm] p-12 shadow-lg print:shadow-none print:w-full print:m-0 relative mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-[#337ab7] pb-6 mb-8">
        <img src={benerLogoUrl} alt="Bener" className="h-14 object-contain" />
        <div className="text-right">
          <h1 className="text-2xl font-bold uppercase text-[#337ab7] tracking-wider">
            Proposta Comercial
          </h1>
          <p className="text-slate-600 font-semibold mt-1 text-base">
            Nº {proposta.numero_proposta || 'RASCUNHO'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Data da Emissão:{' '}
            {proposta.dt_cad
              ? proposta.dt_cad.substring(0, 10).split('-').reverse().join('/')
              : '-'}
          </p>
        </div>
      </div>

      {/* Cliente e Representante */}
      <div className="grid grid-cols-2 gap-8 mb-8 print-break-inside-avoid">
        <div className="bg-slate-50 p-4 rounded-sm border border-slate-100">
          <h2 className="font-bold text-[#337ab7] text-sm uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
            Dados do Cliente
          </h2>
          <div className="space-y-1.5">
            <p>
              <span className="font-semibold text-slate-700">Razão Social:</span> {clienteNome}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Contato:</span>{' '}
              {proposta.contato || '-'}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Telefone:</span>{' '}
              {proposta.telefone || '-'}
            </p>
          </div>
        </div>
        <div className="bg-slate-50 p-4 rounded-sm border border-slate-100">
          <h2 className="font-bold text-[#337ab7] text-sm uppercase tracking-wide border-b border-slate-200 pb-2 mb-3">
            Representante
          </h2>
          <div className="space-y-1.5">
            <p>
              <span className="font-semibold text-slate-700">Nome:</span> {representanteNome}
            </p>
            <p>
              <span className="font-semibold text-slate-700">Gerente:</span> {gerenteNome}
            </p>
          </div>
        </div>
      </div>

      {/* Equipamento */}
      <div className="mb-8 print-break-inside-avoid">
        <h2 className="font-bold text-[#337ab7] text-sm uppercase tracking-wide border-b-2 border-slate-200 pb-2 mb-4">
          Especificações da Versão
        </h2>
        <div className="bg-slate-50 border border-slate-200 p-5 rounded-sm">
          <p className="text-lg font-bold text-slate-800 mb-4">{versaoNome}</p>

          {acessorios.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1 inline-block">
                Acessórios Incluídos
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 mt-2">
                {acessorios.map((acc, i) => (
                  <li key={i}>{acc.nome || 'Acessório'}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Condições Comerciais */}
      <div className="mb-8 print-break-inside-avoid">
        <h2 className="font-bold text-[#337ab7] text-sm uppercase tracking-wide border-b-2 border-slate-200 pb-2 mb-4">
          Preço e Condições
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-white border border-slate-200 p-5 rounded-sm">
          <div className="col-span-2 flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
            <span className="font-bold text-slate-700 text-base">Valor Final:</span>
            <span className="text-xl font-bold text-[#337ab7]">
              {formatCurrency(proposta.valor_final, proposta.moeda)}
            </span>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Condições de Pagamento
            </p>
            <p className="text-slate-800">
              {proposta.condicoes_pagamento || tipoProposta?.condicoes_pagamento || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Prazo de Entrega
            </p>
            <p className="text-slate-800">
              {proposta.prazo_entrega || tipoProposta?.prazo_entrega || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Validade da Oferta
            </p>
            <p className="text-slate-800">{tipoProposta?.validade_oferta || '-'}</p>
          </div>

          {tipoProposta?.frase_preco && (
            <div className="col-span-2 mt-2 pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Frase de Preço
              </p>
              <p className="text-slate-800 font-medium">{tipoProposta.frase_preco}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cláusulas Contratuais */}
      {tipoProposta && (
        <div className="mb-8 space-y-6 print-break-inside-avoid">
          <h2 className="font-bold text-[#337ab7] text-sm uppercase tracking-wide border-b-2 border-slate-200 pb-2 mb-4">
            Cláusulas Contratuais e Condições Gerais
          </h2>

          <div className="grid grid-cols-1 gap-6 text-justify text-slate-600">
            {tipoProposta.garantia && (
              <div>
                <h3 className="font-bold text-slate-800 mb-1">1. Garantia</h3>
                <p className="whitespace-pre-wrap">{tipoProposta.garantia}</p>
              </div>
            )}

            {tipoProposta.assistencia_tecnica && (
              <div>
                <h3 className="font-bold text-slate-800 mb-1">2. Assistência Técnica</h3>
                <p className="whitespace-pre-wrap">{tipoProposta.assistencia_tecnica}</p>
              </div>
            )}

            {tipoProposta.treinamento_tecnico && (
              <div>
                <h3 className="font-bold text-slate-800 mb-1">3. Treinamento Técnico</h3>
                <p className="whitespace-pre-wrap">{tipoProposta.treinamento_tecnico}</p>
              </div>
            )}

            {tipoProposta.transporte_seguro && (
              <div>
                <h3 className="font-bold text-slate-800 mb-1">4. Transporte e Seguro</h3>
                <p className="whitespace-pre-wrap">{tipoProposta.transporte_seguro}</p>
              </div>
            )}

            {(tipoProposta.imposto_ipi || tipoProposta.imposto_icms) && (
              <div className="print-break-inside-avoid">
                <h3 className="font-bold text-slate-800 mb-1">5. Impostos</h3>
                <div className="bg-slate-50 p-3 border border-slate-200 rounded-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    {tipoProposta.imposto_ipi && (
                      <li>
                        <strong>IPI:</strong> {tipoProposta.imposto_ipi}
                      </li>
                    )}
                    {tipoProposta.imposto_icms && (
                      <li>
                        <strong>ICMS:</strong> {tipoProposta.imposto_icms}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-16 pt-6 border-t border-slate-300 text-center text-slate-500 text-xs print-break-inside-avoid">
        <p className="font-semibold text-slate-700 mb-1">
          Bener - Soluções em Máquinas e Equipamentos
        </p>
        <p>Este é um documento gerado eletronicamente e tem validade como proposta comercial.</p>
      </div>
    </div>
  )
}
