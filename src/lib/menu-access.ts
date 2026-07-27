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
  'propostas_criadas',
  'emitir_proposta',
  'emitir_licitacao',
  'propostas_avancadas',
  'tipos_propostas',
  'dashboard_licitacoes',
  'area_atuacao',
  'configuracoes',
  'auditoria',
  'projetos',
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
  propostas_criadas: true,
  emitir_proposta: true,
  emitir_licitacao: false,
  propostas_avancadas: false,
  tipos_propostas: false,
  dashboard_licitacoes: false,
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
  '/controle-propostas/propostas-criadas': 'propostas_criadas',
  '/controle-propostas/emitir-proposta': 'emitir_proposta',
  '/controle-propostas/emitir': 'emitir_licitacao',
  '/controle-propostas/propostas-avancadas': 'propostas_avancadas',
  '/controle-propostas/tipos-propostas': 'tipos_propostas',
  '/controle-propostas/proposta-pdf': 'propostas',
  '/controle-propostas/dashboard-geral': 'propostas',
  '/controle-propostas/dashboard': 'dashboard_licitacoes',
  '/controle-propostas': 'propostas_criadas',
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
  '/projetos': 'projetos',
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
  if (access[menuKey] !== undefined) return access[menuKey] === true
  if (menuKey === 'propostas_criadas' || menuKey === 'emitir_proposta') {
    return access['propostas'] === true
  }
  return false
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
      'propostas_criadas',
      'emitir_proposta',
      'emitir_licitacao',
      'propostas_avancadas',
      'tipos_propostas',
      'dashboard_licitacoes',
    ],
  },
  { title: 'Outros', keys: ['eventos', 'area_atuacao', 'configuracoes', 'auditoria', 'projetos'] },
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
  propostas_criadas: 'Propostas Criadas',
  emitir_proposta: 'Emitir Proposta',
  emitir_licitacao: 'Emitir Licitação',
  propostas_avancadas: 'Propostas Avançadas',
  tipos_propostas: 'Tipos de Propostas',
  dashboard_licitacoes: 'Dashboard de Licitações',
  area_atuacao: 'Área de Atuação',
  configuracoes: 'Configurações',
  auditoria: 'Auditoria',
  projetos: 'Projetos',
}

export const PERMISSION_TEMPLATES: Array<{
  name: string
  description: string
  access: MenuAccess
}> = [
  {
    name: 'Vendedor',
    description: 'Acesso a clientes, propostas e produtos',
    access: {
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
      propostas_criadas: true,
      emitir_proposta: true,
      emitir_licitacao: false,
      propostas_avancadas: false,
      tipos_propostas: false,
      dashboard_licitacoes: false,
      area_atuacao: false,
      configuracoes: false,
      auditoria: false,
      projetos: true,
    },
  },
  {
    name: 'Gerente',
    description: 'Acesso gerencial ampliado',
    access: {
      clientes: true,
      representantes: true,
      regioes: true,
      gerentes: true,
      prepostos: true,
      eventos: true,
      categorias: true,
      marcas: true,
      produtos: true,
      modelos: true,
      versoes: true,
      acessorios: true,
      alterar_precos: true,
      propostas: true,
      emitir_proposta: true,
      emitir_licitacao: true,
      propostas_avancadas: true,
      tipos_propostas: true,
      dashboard_licitacoes: true,
      area_atuacao: true,
      configuracoes: false,
      auditoria: true,
      projetos: true,
    },
  },
  {
    name: 'Financeiro',
    description: 'Acesso a propostas e preços',
    access: {
      clientes: true,
      representantes: false,
      regioes: false,
      gerentes: false,
      prepostos: false,
      eventos: false,
      categorias: false,
      marcas: false,
      produtos: true,
      modelos: false,
      versoes: true,
      acessorios: false,
      alterar_precos: true,
      propostas: true,
      emitir_proposta: false,
      emitir_licitacao: false,
      propostas_avancadas: true,
      tipos_propostas: false,
      dashboard_licitacoes: false,
      area_atuacao: false,
      configuracoes: false,
      auditoria: false,
      projetos: false,
    },
  },
  {
    name: 'Admin Completo',
    description: 'Acesso total ao sistema',
    access: { ...DEFAULT_ADMIN_ACCESS },
  },
]
