import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropostaCleanDocument } from '@/components/PropostaCleanDocument'
import { getProposta } from '@/services/propostas'
import { getTiposProposta } from '@/services/tipos-propostas'
import pb from '@/lib/pocketbase/client'
import './PrintProposta.css'

export default function PrintProposta() {
  const { id } = useParams()
  const [data, setData] = useState<any>(null)
  const [tipos, setTipos] = useState<any[]>([])
  const [draftSignatureUrl, setDraftSignatureUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('ID da proposta não fornecido.')
      setLoading(false)
      return
    }

    if (id === 'draft') {
      const draftData = sessionStorage.getItem('proposta-draft-data')
      const sigUrl = sessionStorage.getItem('proposta-draft-signature')
      if (draftData) {
        setData(JSON.parse(draftData))
        if (sigUrl) setDraftSignatureUrl(sigUrl)
      } else {
        setError('Dados do rascunho não encontrados.')
      }
      getTiposProposta()
        .then(setTipos)
        .catch(() => {})
        .finally(() => setLoading(false))
      return
    }

    Promise.all([getProposta(id), getTiposProposta()])
      .then(([prop, tps]) => {
        setData(prop)
        setTipos(tps)
        setLoading(false)
      })
      .catch(() => {
        setError('Erro ao carregar a proposta.')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="print-loading">
        <div className="spinner" />
        <p>Carregando proposta...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="print-error">
        <p>{error || 'Proposta não encontrada.'}</p>
      </div>
    )
  }

  const selectedCliente = data.expand?.cliente
  const selectedRep = data.expand?.representante
  const selectedVersao = data.expand?.versao
  const modelo = selectedVersao?.expand?.modelo
  const gerente = data.expand?.gerente
  const user = data.expand?.user
  const tipoProposta =
    tipos.find((t) => t.id === data.tipo_proposta) || data.expand?.tipo_proposta || null

  const clienteEndereco = selectedCliente
    ? `${selectedCliente.logradouro || ''}, ${selectedCliente.numero || ''} - ${selectedCliente.bairro || ''} - ${selectedCliente.cidade || ''}/${selectedCliente.estado || ''}`.replace(
        /^[,\s/-]+|[,\s/-]+$/g,
        '',
      )
    : ''

  const getGerenteAssinatura = () => {
    const gUser = gerente?.expand?.usuario
    return gUser?.assinatura ? pb.files.getURL(gUser, gUser.assinatura) : null
  }

  const getAssinaturaRep = () => {
    if (data.assinatura_representante) return pb.files.getURL(data, data.assinatura_representante)
    if (draftSignatureUrl) return draftSignatureUrl
    if (user?.assinatura) return pb.files.getURL(user, user.assinatura)
    return null
  }

  return (
    <div className="print-page">
      <div className="print-actions no-print">
        <Button
          onClick={() => window.print()}
          className="bg-[#337ab7] hover:bg-[#286090] text-white gap-2"
        >
          <Printer className="w-4 h-4" /> Imprimir Proposta
        </Button>
      </div>
      <div className="proposta-document">
        <PropostaCleanDocument
          proposta={data}
          tipoProposta={tipoProposta}
          clienteNome={
            selectedCliente?.fantasia ||
            selectedCliente?.razao_social ||
            data.cliente_original ||
            '-'
          }
          clienteEndereco={clienteEndereco}
          clienteEmail={selectedCliente?.email || ''}
          clienteCnpj={selectedCliente?.documento || ''}
          clienteTelefone={selectedCliente?.telefone || selectedCliente?.celular || ''}
          clienteContato={data.contato || ''}
          representanteNome={selectedRep?.fantasia || data.representante_original || '-'}
          representanteSigla={
            selectedRep?.sigla || selectedRep?.fantasia?.substring(0, 3).toUpperCase() || '-'
          }
          representanteTelefone={selectedRep?.telefone_principal || selectedRep?.telefone || ''}
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
          especificacoesJson={modelo?.expand?.produto?.especificacoes}
          assinaturaRepresentanteUrl={getAssinaturaRep()}
          gerenteAssinaturaUrl={getGerenteAssinatura()}
          issuerName={user?.name}
          issuerSectorLabel={user?.setor || 'Comercial'}
        />
      </div>
    </div>
  )
}
