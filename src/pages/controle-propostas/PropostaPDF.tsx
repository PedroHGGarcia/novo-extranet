import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getProposta, type Proposta } from '@/services/propostas'
import { getTipoProposta, type TipoProposta } from '@/services/tipos-propostas'
import { format } from 'date-fns'

const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
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

export default function PropostaPDF() {
  const { id } = useParams<{ id: string }>()
  const [proposta, setProposta] = useState<Proposta | null>(null)
  const [tipoProposta, setTipoProposta] = useState<TipoProposta | null>(null)

  useEffect(() => {
    if (id) {
      getProposta(id).then(async (p) => {
        setProposta(p)
        if (p.tipo_proposta) {
          try {
            const tp = await getTipoProposta(p.tipo_proposta)
            setTipoProposta(tp)
          } catch {
            /* intentionally ignored */
          }
        }
        setTimeout(() => {
          window.print()
        }, 1000)
      })
    }
  }, [id])

  if (!proposta) {
    return <div className="p-8 text-center text-slate-500">Carregando documento...</div>
  }

  const clienteNome =
    proposta.expand?.cliente?.razao_social ||
    proposta.expand?.cliente?.fantasia ||
    proposta.cliente_original ||
    '-'
  const representanteNome =
    proposta.expand?.representante?.fantasia || proposta.representante_original || '-'
  const versaoNome = proposta.expand?.versao?.nome || proposta.versao_original || '-'

  return (
    <div className="bg-white text-slate-800 p-8 max-w-4xl mx-auto font-sans text-sm">
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold uppercase">Proposta Comercial</h1>
          <p className="text-slate-500">Nº {proposta.numero_proposta}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold">Data da Emissão</p>
          <p>{proposta.dt_cad ? format(new Date(proposta.dt_cad), 'dd/MM/yyyy') : '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <h2 className="font-bold text-slate-600 border-b border-slate-200 mb-2">
            Dados do Cliente
          </h2>
          <p>
            <strong>Razão Social:</strong> {clienteNome}
          </p>
          <p>
            <strong>Contato:</strong> {proposta.contato || '-'}
          </p>
          <p>
            <strong>Telefone:</strong> {proposta.telefone || '-'}
          </p>
        </div>
        <div>
          <h2 className="font-bold text-slate-600 border-b border-slate-200 mb-2">Representante</h2>
          <p>
            <strong>Nome:</strong> {representanteNome}
          </p>
          <p>
            <strong>Gerente:</strong>{' '}
            {proposta.expand?.gerente?.nome || proposta.gerente_original || '-'}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-bold text-slate-600 border-b border-slate-200 mb-2">Equipamento</h2>
        <p className="text-lg font-semibold text-slate-800 mb-2">{versaoNome}</p>

        {proposta.acessorios_proposta && proposta.acessorios_proposta.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-sm mb-2">Acessórios Incluídos</h3>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {proposta.acessorios_proposta
                .filter((a: any) => a.incluir || a.estado === 'incluir')
                .map((acc: any, i: number) => (
                  <li key={i}>{acc.nome}</li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="font-bold text-slate-600 border-b border-slate-200 mb-2">
          Condições Comerciais
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <p>
            <strong>Valor:</strong>{' '}
            <span className="text-lg font-bold">
              {formatCurrency(proposta.valor_final, proposta.moeda)}
            </span>
          </p>
          <p>
            <strong>Condições de Pagamento:</strong>{' '}
            {proposta.condicoes_pagamento || tipoProposta?.condicoes_pagamento || '-'}
          </p>
          <p>
            <strong>Prazo de Entrega:</strong>{' '}
            {proposta.prazo_entrega || tipoProposta?.prazo_entrega || '-'}
          </p>
          <p>
            <strong>Validade da Oferta:</strong> {tipoProposta?.validade_oferta || '-'}
          </p>
          {tipoProposta?.frase_preco && (
            <p className="col-span-2">
              <strong>Frase de Preço:</strong> {tipoProposta.frase_preco}
            </p>
          )}
        </div>
      </div>

      {tipoProposta && (
        <div className="mb-8 space-y-4">
          <h2 className="font-bold text-slate-600 border-b border-slate-200 mb-2">
            Termos Comerciais e Condições Gerais
          </h2>

          {tipoProposta.garantia && (
            <div>
              <h3 className="font-semibold">Garantia</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{tipoProposta.garantia}</p>
            </div>
          )}

          {tipoProposta.assistencia_tecnica && (
            <div>
              <h3 className="font-semibold">Assistência Técnica</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">
                {tipoProposta.assistencia_tecnica}
              </p>
            </div>
          )}

          {tipoProposta.treinamento_tecnico && (
            <div>
              <h3 className="font-semibold">Treinamento Técnico</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">
                {tipoProposta.treinamento_tecnico}
              </p>
            </div>
          )}

          {tipoProposta.transporte_seguro && (
            <div>
              <h3 className="font-semibold">Transporte/Seguro</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">
                {tipoProposta.transporte_seguro}
              </p>
            </div>
          )}

          {tipoProposta.validade_oferta && (
            <div>
              <h3 className="font-semibold">Validade da Oferta</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">
                {tipoProposta.validade_oferta}
              </p>
            </div>
          )}

          {(proposta.condicoes_pagamento || tipoProposta.condicoes_pagamento) && (
            <div>
              <h3 className="font-semibold">Condições de Pagamento</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">
                {proposta.condicoes_pagamento || tipoProposta.condicoes_pagamento}
              </p>
            </div>
          )}

          {(tipoProposta.imposto_ipi || tipoProposta.imposto_icms) && (
            <div>
              <h3 className="font-semibold">Impostos</h3>
              <ul className="list-disc pl-5 text-sm text-slate-600">
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
          )}
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-500 text-xs">
        <p>Este é um documento gerado eletronicamente e tem validade como proposta comercial.</p>
      </div>
    </div>
  )
}
