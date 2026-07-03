import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropostaDocument } from '@/components/PropostaDocument'
import { getProposta } from '@/services/propostas'
import { getTiposProposta } from '@/services/tipos-propostas'
import pb from '@/lib/pocketbase/client'

export default function PropostaPDF() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<any>(null)
  const [tipos, setTipos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([getProposta(id), getTiposProposta()])
      .then(([prop, tps]) => {
        setData(prop)
        setTipos(tps)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#337ab7]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-slate-600">Proposta não encontrada.</p>
        <Button onClick={() => navigate('/controle-propostas/emitir')}>Voltar para Lista</Button>
      </div>
    )
  }

  const selectedCliente = data.expand?.cliente
  const selectedRep = data.expand?.representante
  const selectedVersao = data.expand?.versao
  const modelo = selectedVersao?.expand?.modelo
  const gerente = data.expand?.gerente
  const user = data.expand?.user

  const tipoProposta = tipos.find((t) => t.id === data.tipo_proposta) || null

  const getGerenteAssinatura = () => {
    const gUser = gerente?.expand?.usuario
    if (gUser?.assinatura) {
      return pb.files.getURL(gUser, gUser.assinatura)
    }
    return null
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-8 relative">
      <div className="w-full max-w-5xl flex justify-between items-center mb-6 px-4 print:hidden">
        <Button
          variant="outline"
          onClick={() => navigate('/controle-propostas/emitir')}
          className="gap-2 bg-white text-slate-700 hover:text-slate-900 shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a Lista de Propostas
        </Button>
        <Button
          onClick={() => window.print()}
          className="bg-[#337ab7] hover:bg-[#286090] text-white gap-2 shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimir PDF
        </Button>
      </div>
      <div className="bg-white shadow-xl overflow-hidden w-fit print:shadow-none print:w-full">
        <PropostaDocument
          proposta={data}
          tipoProposta={tipoProposta}
          clienteNome={
            selectedCliente?.fantasia ||
            selectedCliente?.razao_social ||
            data.cliente_original ||
            '-'
          }
          clienteEndereco={
            selectedCliente
              ? `${selectedCliente.logradouro || ''}, ${selectedCliente.numero || ''} - ${selectedCliente.bairro || ''} - ${selectedCliente.cidade || ''}`.replace(
                  /^[,\s-]+|[,\s-]+$/g,
                  '',
                )
              : ''
          }
          clienteEmail={selectedCliente?.email || ''}
          clienteCnpj={selectedCliente?.documento || ''}
          representanteNome={selectedRep?.fantasia || data.representante_original || '-'}
          representanteSigla={
            selectedRep?.sigla || selectedRep?.fantasia?.substring(0, 3).toUpperCase() || '-'
          }
          versaoNome={selectedVersao?.nome || data.versao_original || '-'}
          versaoImagemUrl={
            selectedVersao?.imagem_preview
              ? pb.files.getURL(selectedVersao, selectedVersao.imagem_preview)
              : null
          }
          categoriaNome={modelo?.expand?.produto?.expand?.categoria?.nome || 'EQUIPAMENTO'}
          marcaNome={modelo?.expand?.marca?.nome || '-'}
          gerenteNome={gerente?.nome || data.gerente_original || '-'}
          acessorios={(data.acessorios_proposta || []).filter(
            (a: any) => a.estado === 'incluir' || a.estado === 'exibir',
          )}
          acessoriosStandards={selectedVersao?.acessorios_standards || ''}
          caracteristicasConstrutivas={selectedVersao?.caracteristicas_construtivas || ''}
          especificacoesTecnicas={selectedVersao?.especificacoes_tecnicas || ''}
          assinaturaRepresentanteUrl={
            data.assinatura_representante
              ? pb.files.getURL(data, data.assinatura_representante)
              : null
          }
          representanteAssinaturaUrl={
            user?.assinatura ? pb.files.getURL(user, user.assinatura) : null
          }
          issuerName={user?.name}
          issuerSectorLabel={user?.setor || 'Comercial'}
          gerenteAssinaturaUrl={getGerenteAssinatura()}
        />
      </div>
    </div>
  )
}
