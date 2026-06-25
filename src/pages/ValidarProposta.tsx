import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Clock, XCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ValidarProposta() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/validar-proposta/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#337ab7]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-4">
        <AlertCircle className="w-16 h-16 text-rose-500" />
        <h2 className="text-xl font-bold text-slate-800 text-center">Proposta não encontrada</h2>
        <p className="text-slate-500 text-center max-w-md">
          Este documento não pôde ser verificado em nosso sistema. Verifique se o QR Code ou o link
          estão corretos.
        </p>
        <Link to="/" className="text-[#337ab7] hover:underline mt-4 flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>
      </div>
    )
  }

  const statusIcons: any = {
    'Em Análise': <Clock className="w-14 h-14 text-amber-500 mx-auto" />,
    Aprovada: <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />,
    Recusada: <XCircle className="w-14 h-14 text-rose-500 mx-auto" />,
  }

  const statusColors: any = {
    'Em Análise': 'bg-amber-50 border-amber-200 text-amber-700',
    Aprovada: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    Recusada: 'bg-rose-50 border-rose-200 text-rose-700',
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-12 px-4 sm:py-24">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-[#337ab7] p-6 text-center text-white">
          <h1 className="text-xl font-bold tracking-wider uppercase mb-1">
            Validação de Documento
          </h1>
          <p className="text-blue-100 text-sm opacity-90">Bener Extranet</p>
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          <div className="mb-4">{statusIcons[data.status] || statusIcons['Em Análise']}</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Proposta Autêntica</h2>
          <p className="text-slate-500 mb-8 text-sm">
            Este documento foi emitido validamente por nosso sistema e encontra-se registrado com os
            dados abaixo:
          </p>

          <div className="w-full text-left space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                Número da Proposta
              </span>
              <span className="block text-lg font-bold text-slate-800">{data.numero_proposta}</span>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                Cliente
              </span>
              <span className="block font-medium text-slate-800">{data.cliente_nome}</span>
            </div>

            <div className="border-b border-slate-100 pb-3">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                Data de Emissão
              </span>
              <span className="block font-medium text-slate-800">
                {data.dt_cad ? format(new Date(data.dt_cad), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
              </span>
            </div>

            <div className="pt-2">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
                Status Atual
              </span>
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-full border text-sm font-semibold ${statusColors[data.status] || statusColors['Em Análise']}`}
              >
                {data.status || 'Em Análise'}
              </div>
              {data.data_alteracao_status && (
                <div className="mt-3 text-[11px] text-slate-500 font-medium">
                  Última atualização:{' '}
                  {format(new Date(data.data_alteracao_status), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-5 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Em caso de dúvidas, entre em contato com seu representante comercial Bener.
          </p>
        </div>
      </div>
    </div>
  )
}
