const FIELD_LABELS: Record<string, string> = {
  fantasia: 'Nome Fantasia',
  razao_social: 'Razão Social',
  documento: 'CPF/CNPJ',
  status: 'Status',
  contato: 'Contato',
  telefone: 'Telefone 1',
  telefone_2: 'Telefone 2',
  telefone_3: 'Telefone 3',
  celular: 'Celular',
  email: 'E-mail',
  email_fiscal: 'E-mail Fiscal',
  cep: 'CEP',
  estado: 'Estado',
  cidade: 'Cidade',
  bairro: 'Bairro',
  logradouro: 'Logradouro',
  numero: 'Número',
  complementos: 'Complementos',
  contatos_adicionais: 'Contatos Adicionais',
  dt_cad: 'Data de Cadastro',
  limite_credito: 'Limite de Crédito',
}

const SKIP_FIELDS = ['id', 'created', 'updated', 'collectionId', 'collectionName', 'atualizado_por']

export interface FieldChange {
  label: string
  oldValue?: string
  newValue?: string
}

export function getFieldLabel(key: string): string {
  return FIELD_LABELS[key] || key
}

export function formatValue(val: unknown): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não'
  if (Array.isArray(val)) return `${val.length} item(ns)`
  if (typeof val === 'object') return JSON.stringify(val).substring(0, 80)
  return String(val)
}

export function getChanges(dados: any, acao: string): FieldChange[] {
  if (!dados) return []
  if (acao.toLowerCase() === 'update' && dados.old && dados.new) {
    const changes: FieldChange[] = []
    const allKeys = new Set([...Object.keys(dados.old), ...Object.keys(dados.new)])
    for (const key of allKeys) {
      if (SKIP_FIELDS.includes(key)) continue
      const oldVal = dados.old[key]
      const newVal = dados.new[key]
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          label: getFieldLabel(key),
          oldValue: formatValue(oldVal),
          newValue: formatValue(newVal),
        })
      }
    }
    return changes
  }
  const changes: FieldChange[] = []
  for (const [key, val] of Object.entries(dados)) {
    if (SKIP_FIELDS.includes(key)) continue
    if (val !== '' && val !== null && val !== undefined) {
      changes.push({ label: getFieldLabel(key), newValue: formatValue(val) })
    }
  }
  return changes
}
