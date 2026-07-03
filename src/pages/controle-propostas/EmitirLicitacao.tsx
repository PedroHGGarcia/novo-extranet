import { Link } from 'react-router-dom'
import {
  FileText,
  PenTool,
  CheckCircle,
  ArrowLeft,
  Printer,
  ShieldAlert,
  Loader2,
  Plus,
  Trash2,
  ImagePlus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchableCombobox } from '@/components/SearchableCombobox'
import { SignaturePad } from '@/components/SignaturePad'
import { SecaoPrecos } from '@/components/SecaoPrecos'
import { MemoriaCalculo } from '@/components/MemoriaCalculo'
import { CurrencyWidget } from '@/components/CurrencyWidget'
import { useLicitacao } from '@/hooks/use-licitacao'
import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

const formatCurrency = (v: number | undefined, c = 'BRL') => {
  if (v === undefined) return '-'
  const map: Record<string, string> = { Dolar: 'USD', Real: 'BRL', Euro: 'EUR', US$: 'USD' }
  const code = map[c] || c || 'BRL'
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: code }).format(v)
  } catch {
    return `${code} ${v}`
  }
}

const TEXT_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'descricao_proposta', label: 'Descrição da Proposta' },
  { key: 'especificacoes_tecnicas', label: 'Especificações Técnicas' },
  { key: 'materiais_utilizados', label: 'Materiais Utilizados' },
  { key: 'certificacoes', label: 'Certificações' },
  { key: 'normas_aplicaveis', label: 'Normas Aplicáveis' },
  { key: 'certificacoes_seguranca', label: 'Certificações de Segurança' },
  { key: 'normas_seguranca', label: 'Normas de Segurança' },
  { key: 'cobertura_garantia', label: 'Cobertura da Garantia' },
  { key: 'assistencia_tecnica_detalhada', label: 'Assistência Técnica Detalhada' },
  { key: 'criterios_aceitacao', label: 'Critérios de Aceitação' },
  { key: 'garantia_acessorios', label: 'Garantia dos Acessórios' },
  { key: 'validade_oferta', label: 'Validade da Oferta' },
  { key: 'treinamento_tecnico', label: 'Treinamento Técnico' },
  { key: 'transporte_seguro', label: 'Transporte/Seguro' },
  { key: 'imposto_ipi', label: 'Imposto IPI' },
  { key: 'imposto_icms', label: 'Imposto ICMS' },
]

const inputClass =
  'w-full bg-white border border-slate-300 rounded-sm px-2 py-1.5 outline-none text-slate-700 text-xs focus:border-[#337ab7] min-h-[30px]'
const labelClass = 'text-[11px] font-bold text-slate-700 mb-1'

export default function EmitirLicitacao() {
  const lic = useLicitacao()
  const { formData: f, setFormData, errors: err } = lic

  const addCustomSection = () => {
    lic.setCustomSections([...lic.customSections, { titulo: '', descricao: '' }])
  }

  const updateCustomSection = (index: number, field: 'titulo' | 'descricao', value: string) => {
    const updated = [...lic.customSections]
    updated[index] = { ...updated[index], [field]: value }
    lic.setCustomSections(updated)
  }

  const removeCustomSection = (index: number) => {
    lic.setCustomSections(lic.customSections.filter((_, i) => i !== index))
  }

  if (lic.loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#337ab7]" />
      </div>
    )
  }

  if (!lic.hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <ShieldAlert className="h-16 w-16 text-rose-500" />
        <h2 className="text-xl font-semibold text-slate-700">Acesso Negado</h2>
        <p className="text-sm text-slate-500 text-center max-w-md">
          Você não tem permissão para emitir propostas de licitação. Solicite ao administrador a
          ativação da permissão específica.
        </p>
        <Link to="/controle-propostas/emitir-proposta">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
      </div>
    )
  }

  if (lic.createdId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
          <CheckCircle className="h-10 w-10 text-emerald-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            Proposta de Licitação Criada!
          </h2>
          <p className="text-sm text-slate-500">Sua proposta foi salva com sucesso.</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/controle-propostas/proposta-pdf/${lic.createdId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-[#337ab7] hover:bg-[#286090] gap-2">
              <Printer className="h-4 w-4" /> Visualizar / Imprimir PDF
            </Button>
          </a>
          <Button variant="outline" onClick={lic.resetForm} className="gap-2">
            <FileText className="h-4 w-4" /> Nova Proposta
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 shrink-0">
        <Link to="/controle-propostas/emitir-proposta">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-500">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        <h1 className="text-lg font-normal text-[#337ab7] flex items-center gap-2">
          <FileText className="h-5 w-5" /> Emitir Proposta de Licitação
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">
              Dados Gerais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Cliente *</label>
                <SearchableCombobox
                  items={lic.clientes}
                  value={f.cliente || ''}
                  onChange={lic.handleClienteChange}
                  getLabel={(c) => c.fantasia || c.razao_social}
                  getSearchText={(c) => `${c.fantasia || ''} ${c.razao_social || ''}`}
                  placeholder="Buscar cliente..."
                  emptyMessage="Nenhum cliente encontrado."
                  className={cn(inputClass, err.cliente && 'border-rose-400 bg-rose-50/30')}
                  onSearch={lic.searchClientes}
                />
                {err.cliente && (
                  <span className="text-[10px] text-rose-600 mt-0.5">{err.cliente}</span>
                )}
              </div>
              <div>
                <label className={labelClass}>Representante *</label>
                <SearchableCombobox
                  items={lic.representantes}
                  value={f.representante || ''}
                  onChange={(id) => setFormData({ ...f, representante: id })}
                  getLabel={(r) => r.fantasia}
                  getSearchText={(r) => `${r.fantasia || ''} ${r.sigla || ''}`}
                  placeholder="Buscar representante..."
                  emptyMessage="Nenhum representante encontrado."
                  className={cn(inputClass, err.representante && 'border-rose-400 bg-rose-50/30')}
                  onSearch={lic.searchRepresentantes}
                />
                {err.representante && (
                  <span className="text-[10px] text-rose-600 mt-0.5">{err.representante}</span>
                )}
              </div>
              <div>
                <label className={labelClass}>Versão *</label>
                <select
                  className={cn(inputClass, err.versao && 'border-rose-400 bg-rose-50/30')}
                  value={f.versao || ''}
                  onChange={(e) => lic.handleVersaoChange(e.target.value)}
                >
                  <option value="">-- Selecione --</option>
                  {lic.versoes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </select>
                {err.versao && (
                  <span className="text-[10px] text-rose-600 mt-0.5">{err.versao}</span>
                )}
              </div>
              <div>
                <label className={labelClass}>Tipo de Proposta *</label>
                <select
                  className={cn(inputClass, err.tipo_proposta && 'border-rose-400 bg-rose-50/30')}
                  value={f.tipo_proposta || ''}
                  disabled={!f.versao}
                  onChange={(e) => lic.handleTipoPropostaChange(e.target.value)}
                >
                  <option value="">-- Selecione --</option>
                  {(() => {
                    const v = lic.versoes.find((x) => x.id === f.versao)
                    const ids = v?.tipos_proposta || []
                    return lic.tiposProposta
                      .filter((t) => ids.includes(t.id) && t.status === 'Ativo')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))
                  })()}
                </select>
                {err.tipo_proposta && (
                  <span className="text-[10px] text-rose-600 mt-0.5">{err.tipo_proposta}</span>
                )}
                {lic.templateAppliedFields.size > 0 && (
                  <span className="text-[10px] text-blue-600 mt-0.5 flex items-center gap-1 animate-fade-in">
                    <CheckCircle className="h-3 w-3" />
                    {lic.templateAppliedFields.size} campo(s) preenchido(s) automaticamente pelo
                    template. Você pode editá-los manualmente.
                  </span>
                )}
              </div>
              <div>
                <label className={labelClass}>Gerente</label>
                <select
                  className={inputClass}
                  value={f.gerente || ''}
                  onChange={(e) => setFormData({ ...f, gerente: e.target.value })}
                >
                  <option value=""></option>
                  {lic.gerentes.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Data de Emissão</label>
                <input
                  type="date"
                  className={inputClass}
                  value={f.dt_cad ? f.dt_cad.substring(0, 10) : ''}
                  onChange={(e) => setFormData({ ...f, dt_cad: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">
              Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className={labelClass}>Moeda</label>
                <select
                  className={inputClass}
                  value={f.moeda || 'USD'}
                  onChange={(e) => setFormData({ ...f, moeda: e.target.value })}
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Valor sem Desconto</label>
                <input
                  className={cn(inputClass, 'bg-slate-50 cursor-not-allowed')}
                  value={formatCurrency(f.valor_sem_desconto, f.moeda)}
                  readOnly
                />
              </div>
              <div>
                <label className={labelClass}>Desconto (%)</label>
                <input
                  type="number"
                  className={cn(
                    inputClass,
                    (f.percentual_desconto || 0) > 28 && 'border-rose-500 text-rose-600 bg-rose-50',
                  )}
                  value={f.percentual_desconto ?? ''}
                  step="0.01"
                  min="0"
                  onChange={(e) => {
                    const v = e.target.value === '' ? 0 : parseFloat(e.target.value)
                    if (!isNaN(v)) lic.handleDiscountChange(v)
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>Valor Final</label>
                <input
                  className={cn(inputClass, 'bg-slate-50 cursor-not-allowed')}
                  value={formatCurrency(f.valor_final, f.moeda)}
                  readOnly
                />
              </div>
            </div>
          </section>

          <SecaoPrecos
            items={lic.priceItems}
            onAdd={lic.addPriceItem}
            onUpdate={lic.updatePriceItem}
            onRemove={lic.removePriceItem}
          />

          <MemoriaCalculo
            priceItems={lic.priceItems}
            observacoes={lic.memoriaObservacoes}
            onUpdateObservacao={lic.updateMemoriaObservacao}
          />

          <section>
            <div className="flex items-center gap-1.5 mb-3">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                Variação Cambial — USD / EUR / JPY
              </span>
            </div>
            <CurrencyWidget />
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">
              Prazo e Condições
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={cn(labelClass, 'flex items-center gap-1')}>
                  Prazo de Entrega
                  {lic.templateAppliedFields.has('prazo_entrega') && (
                    <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded-sm border border-blue-200 font-normal">
                      Template
                    </span>
                  )}
                </label>
                <input
                  className={cn(
                    inputClass,
                    lic.templateAppliedFields.has('prazo_entrega') &&
                      'border-blue-300 bg-blue-50/30',
                  )}
                  value={f.prazo_entrega || ''}
                  onChange={(e) => setFormData({ ...f, prazo_entrega: e.target.value })}
                />
              </div>
              <div>
                <label className={cn(labelClass, 'flex items-center gap-1')}>
                  Condições de Pagamento
                  {lic.templateAppliedFields.has('condicoes_pagamento') && (
                    <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded-sm border border-blue-200 font-normal">
                      Template
                    </span>
                  )}
                </label>
                <input
                  className={cn(
                    inputClass,
                    lic.templateAppliedFields.has('condicoes_pagamento') &&
                      'border-blue-300 bg-blue-50/30',
                  )}
                  value={f.condicoes_pagamento || ''}
                  onChange={(e) => setFormData({ ...f, condicoes_pagamento: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">
              Detalhes da Licitação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TEXT_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className={cn(labelClass, 'flex items-center gap-1')}>
                    {label}
                    {lic.templateAppliedFields.has(key) && (
                      <span className="text-[9px] text-blue-600 bg-blue-50 px-1 rounded-sm border border-blue-200 font-normal">
                        Template
                      </span>
                    )}
                  </label>
                  <textarea
                    className={cn(
                      inputClass,
                      'min-h-[80px] resize-y',
                      lic.templateAppliedFields.has(key) && 'border-blue-300 bg-blue-50/30',
                    )}
                    value={f[key] || ''}
                    onChange={(e) => setFormData({ ...f, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">
              Informações Adicionais
            </h2>
            <div className="flex flex-col gap-4">
              {lic.customSections.map((section, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 p-4 border border-slate-200 rounded-sm bg-slate-50/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">
                      Campo Personalizado {i + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCustomSection(i)}
                      className="h-6 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div>
                    <label className={labelClass}>Título *</label>
                    <input
                      className={cn(
                        inputClass,
                        err[`secao_${i}_titulo`] && 'border-rose-400 bg-rose-50/30',
                      )}
                      value={section.titulo}
                      onChange={(e) => updateCustomSection(i, 'titulo', e.target.value)}
                      placeholder="Digite o título da seção..."
                    />
                    {err[`secao_${i}_titulo`] && (
                      <span className="text-[10px] text-rose-600 mt-0.5">
                        {err[`secao_${i}_titulo`]}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>Descrição</label>
                    <textarea
                      className={cn(inputClass, 'min-h-[80px] resize-y')}
                      value={section.descricao}
                      onChange={(e) => updateCustomSection(i, 'descricao', e.target.value)}
                      placeholder="Digite a descrição detalhada..."
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Foto</label>
                    {section.imagem ? (
                      <div className="relative inline-block">
                        <img
                          src={section.imagem}
                          alt="Preview"
                          className="max-h-32 rounded border border-slate-300 object-contain"
                        />
                        <button
                          onClick={() => lic.removeSectionImage(i)}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 hover:bg-rose-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-sm py-4 cursor-pointer hover:border-[#337ab7] hover:bg-slate-50/50 transition-colors">
                        <ImagePlus className="h-5 w-5 text-slate-400" />
                        <span className="text-[10px] text-slate-500">Adicionar Foto</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) lic.uploadSectionImage(i, file)
                            e.target.value = ''
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addCustomSection}
                className="gap-2 w-fit text-[#337ab7] border-[#337ab7] hover:bg-[#337ab7] hover:text-white"
              >
                <Plus className="h-4 w-4" /> Adicionar Campo Personalizado
              </Button>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
              <PenTool className="h-4 w-4" /> Assinatura — {lic.issuerSectorLabel}
              <span className="text-[10px] text-amber-600 font-normal ml-1">(Obrigatória)</span>
            </h2>
            {err.assinatura && <p className="text-[10px] text-rose-600 mb-2">{err.assinatura}</p>}
            {lic.signatureConfirmed && lic.signatureBlob ? (
              <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-sm bg-slate-50/50">
                <img
                  src={URL.createObjectURL(lic.signatureBlob)}
                  alt="Assinatura"
                  className="max-h-20 max-w-[200px] object-contain bg-white p-2 border rounded"
                />
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span className="text-xs text-slate-600">Assinatura confirmada</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    lic.setSignatureBlob(null)
                    lic.setSignatureConfirmed(false)
                  }}
                  className="gap-2 text-xs ml-auto"
                >
                  <PenTool className="h-4 w-4" /> Refazer
                </Button>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-amber-300 rounded-sm">
                <p className="text-xs text-amber-600 text-center mb-3">
                  A assinatura é obrigatória para emitir a proposta.
                </p>
                <SignaturePad
                  onConfirm={(blob) => {
                    lic.setSignatureBlob(blob)
                    lic.setSignatureConfirmed(true)
                  }}
                />
              </div>
            )}
          </section>

          <div className="flex gap-2 items-center border-t border-slate-200 pt-4">
            <Button
              onClick={lic.handleSubmit}
              disabled={lic.submitting}
              className="text-white rounded-sm px-6 py-2 h-auto text-xs shadow-none uppercase font-normal bg-[#337ab7] hover:bg-[#286090] disabled:opacity-50"
            >
              {lic.submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Emitindo...
                </>
              ) : (
                'Emitir Proposta de Licitação'
              )}
            </Button>
            <span className="text-[10px] text-slate-500 ml-2">
              Emitido por: <strong className="text-slate-700">{lic.user?.name || '—'}</strong> ·
              Setor: <strong className="text-slate-700">{lic.issuerSectorLabel}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
