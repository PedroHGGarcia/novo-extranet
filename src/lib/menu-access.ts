export const MENU_ACCESS_KEYS = [
  'clientes',
  'representantes',
  'regioes',
  'gerentes',
  'prepostos',
  'eventos',
  'categorias',
  'marcas',
  'produtos',
  'modelos',
  'versoes',
  'acessorios',
  'alterar_precos',
  'propostas',
  'emitir_proposta',
  'emitir_licitacao',
  'propostas_avancadas',
  'tipos_propostas',
  'area_atuacao',
  'configuracoes',
  'auditoria',
] as const

export type MenuAccessKey = (typeof MENU_ACCESS_KEYS)[number]
export type MenuAccess = Record<string, boolean>

export const DEFAULT_ADMIN_ACCESS: MenuAccess = Object.fromEntries(
  MENU_ACCESS_KEYS.map((k) => [k, true]),
)

export const DEFAULT_USER_ACCESS: MenuAccess = {
  clientes: true,
  representantes: true,
  regioes: false,
  gerentes: false,
  prepostos: false,
  eventos: true,
  categorias: false,
  marcas: false,
  produtos: true,
  modelos: false,
  versoes: true,
  acessorios: false,
  alterar_precos: false,
  propostas: true,
  emitir_proposta: true,
  emitir_licitacao: false,
  propostas_avancadas: false,
  tipos_propostas: false,
  area_atuacao: false,
  configuracoes: false,
  auditoria: false,
}

const PATH_TO_MENU_KEY: Record<string, string> = {
  '/cadastros/clientes': 'clientes',
  '/cadastros/representantes': 'representantes',
  '/cadastros/regioes': 'regioes',
  '/cadastros/gerentes': 'gerentes',
  '/eventos': 'eventos',
  '/controle-propostas/emitir-proposta': 'emitir_proposta',
  '/controle-propostas/emitir-licitacao': 'emitir_licitacao',
  '/controle-propostas/propostas-avancadas': 'propostas_avancadas',
  '/controle-propostas/tipos-propostas': 'tipos_propostas',
  '/controle-propostas/proposta-pdf': 'propostas',
  '/controle-propostas/dashboard': 'propostas',
  '/controle-propostas': 'propostas',
  '/produtos/categorias': 'categorias',
  '/produtos/marcas': 'marcas',
  '/produtos/modelos': 'modelos',
  '/produtos/versoes': 'versoes',
  '/produtos/acessorios': 'acessorios',
  '/produtos/alterar-precos': 'alterar_precos',
  '/produtos': 'produtos',
  '/area-atuacao': 'area_atuacao',
  '/configuracoes': 'configuracoes',
  '/auditoria': 'auditoria',
}

export function getMenuKeyForPath(pathname: string): string | null {
  const sorted = Object.keys(PATH_TO_MENU_KEY).sort((a, b) => b.length - a.length)
  for (const path of sorted) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return PATH_TO_MENU_KEY[path]
    }
  }
  return null
}

export function hasMenuAccess(user: any, menuKey: string): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  const access = user.menu_access
  if (!access || typeof access !== 'object') return false
  return access[menuKey] === true
}

export const MENU_ACCESS_GROUPS: Array<{ title: string; keys: string[] }> = [
  { title: 'Cadastros', keys: ['clientes', 'representantes', 'regioes', 'gerentes', 'prepostos'] },
  {
    title: 'Produtos',
    keys: [
      'categorias',
      'marcas',
      'produtos',
      'modelos',
      'versoes',
      'acessorios',
      'alterar_precos',
    ],
  },
  {
    title: 'Propostas',
    keys: [
      'propostas',
      'emitir_proposta',
      'emitir_licitacao',
      'propostas_avancadas',
      'tipos_propostas',
    ],
  },
  { title: 'Outros', keys: ['eventos', 'area_atuacao', 'configuracoes', 'auditoria'] },
]

export const MENU_KEY_LABELS: Record<string, string> = {
  clientes: 'Clientes',
  representantes: 'Representantes',
  regioes: 'Regiões',
  gerentes: 'Gerentes',
  prepostos: 'Prepostos',
  eventos: 'Eventos',
  categorias: 'Categorias',
  marcas: 'Marcas',
  produtos: 'Produtos',
  modelos: 'Modelos',
  versoes: 'Versões',
  acessorios: 'Acessórios',
  alterar_precos: 'Alterar Preços',
  propostas: 'Propostas (Dashboard)',
  emitir_proposta: 'Emitir Proposta',
  emitir_licitacao: 'Emitir Licitação',
  propostas_avancadas: 'Propostas Avançadas',
  tipos_propostas: 'Tipos de Propostas',
  area_atuacao: 'Área de Atuação',
  configuracoes: 'Configurações',
  auditoria: 'Auditoria',
}
