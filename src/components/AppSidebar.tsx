import { Link, useLocation } from 'react-router-dom'
import logoUrl from '@/assets/systemlogoin-large-52274.png'
import {
  Monitor,
  Map,
  Folder,
  CalendarDays,
  FileText,
  Boxes,
  UserCircle,
  ChevronLeft,
  Globe,
  User,
  Briefcase,
  Users,
  Activity,
  Settings,
  LogOut,
  FolderKanban,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { hasMenuAccess } from '@/lib/menu-access'
import { SidebarSubMenu, type SubMenuItem } from '@/components/SidebarSubMenu'

interface MenuItem {
  title: string
  url: string
  icon: any
  sub: SubMenuItem[]
  menuKey?: string
  adminOnly?: boolean
  biddingOnly?: boolean
  fullTitle?: string
}

const menuItems: MenuItem[] = [
  { title: 'Painel Principal', url: '/dashboard', icon: Monitor, sub: [] },
  {
    title: 'Cadastros',
    url: '/cadastros',
    icon: Folder,
    sub: [
      { title: 'Gerentes', url: '/cadastros/gerentes', icon: User, menuKey: 'gerentes' },
      { title: 'Clientes', url: '/cadastros/clientes', icon: Users, menuKey: 'clientes' },
      { title: 'Regiões', url: '/cadastros/regioes', icon: Globe, menuKey: 'regioes' },
      {
        title: 'Representantes',
        url: '/cadastros/representantes',
        icon: Briefcase,
        menuKey: 'representantes',
      },
    ],
  },
  {
    title: 'Controle de Eventos',
    url: '/eventos',
    icon: CalendarDays,
    menuKey: 'eventos',
    sub: [{ title: 'Agenda', url: '/eventos', menuKey: 'eventos' }],
  },
  {
    title: 'Projetos',
    url: '/projetos',
    icon: FolderKanban,
    menuKey: 'projetos',
    sub: [],
  },
  {
    title: 'Controle de Propostas',
    url: '/controle-propostas/dashboard-geral',
    icon: FileText,
    sub: [
      { title: 'Dashboard', url: '/controle-propostas/dashboard-geral', menuKey: 'propostas' },
      {
        title: 'Emitir Proposta',
        url: '/controle-propostas/emitir-proposta',
        menuKey: 'emitir_proposta',
      },
      {
        title: 'Licitações',
        url: '/controle-propostas/dashboard',
        biddingOnly: true,
        sub: [
          {
            title: 'Emitir Licitação',
            url: '/controle-propostas/emitir',
            fullTitle: 'Emitir Proposta de Licitação',
            biddingOnly: true,
          },
          {
            title: 'Dashboard de Licitações',
            url: '/controle-propostas/dashboard',
            biddingOnly: true,
            menuKey: 'dashboard_licitacoes',
          },
        ],
      },
      {
        title: 'Propostas Avançadas',
        url: '/controle-propostas/propostas-avancadas',
        menuKey: 'propostas_avancadas',
      },
      {
        title: 'Tipos de Propostas',
        url: '/controle-propostas/tipos-propostas',
        menuKey: 'tipos_propostas',
      },
    ],
  },
  {
    title: 'Controle de Produtos',
    url: '/produtos',
    icon: Boxes,
    sub: [
      { title: 'Categorias', url: '/produtos/categorias', menuKey: 'categorias' },
      { title: 'Produtos', url: '/produtos', menuKey: 'produtos' },
      { title: 'Marcas', url: '/produtos/marcas', menuKey: 'marcas' },
      { title: 'Modelos', url: '/produtos/modelos', menuKey: 'modelos' },
      { title: 'Versões', url: '/produtos/versoes', menuKey: 'versoes' },
      { title: 'Acessórios', url: '/produtos/acessorios', menuKey: 'acessorios' },
      { title: 'Alterar Preços', url: '/produtos/alterar-precos', menuKey: 'alterar_precos' },
    ],
  },
  { title: 'Perfil', url: '/perfil', icon: UserCircle, sub: [] },
  {
    title: 'Área de Atuação de Representantes',
    url: '/area-atuacao',
    icon: Map,
    menuKey: 'area_atuacao',
    sub: [],
  },
  { title: 'Usuários', url: '/usuarios', icon: Users, sub: [], adminOnly: true },
  { title: 'Logs de Auditoria', url: '/auditoria', icon: Activity, menuKey: 'auditoria', sub: [] },
  {
    title: 'Configurações',
    url: '/configuracoes',
    icon: Settings,
    menuKey: 'configuracoes',
    sub: [],
  },
]

const btnCls =
  'h-11 rounded-none text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10 data-[active=true]:bg-white/5 data-[active=true]:text-white data-[active=true]:font-semibold transition-colors duration-200'

function isPathActive(pathname: string, url: string): boolean {
  return pathname === url || pathname.startsWith(url + '/')
}

function hasActiveDescendant(items: SubMenuItem[] | undefined, pathname: string): boolean {
  if (!items || items.length === 0) return false
  return items.some((s) => isPathActive(pathname, s.url) || hasActiveDescendant(s.sub, pathname))
}

export function AppSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const canSeeSub = (s: SubMenuItem): boolean => {
    if (s.sub && s.sub.length > 0) return s.sub.some(canSeeSub)
    if (s.biddingOnly && user?.role !== 'admin') {
      const hasBiddingPerm = user?.can_issue_bidding_proposals === true
      const hasMenuPerm = s.menuKey ? hasMenuAccess(user, s.menuKey) : false
      return hasBiddingPerm || hasMenuPerm
    }
    if (s.menuKey) return hasMenuAccess(user, s.menuKey)
    return true
  }

  const filterSubItems = (items: SubMenuItem[]): SubMenuItem[] =>
    items.filter(canSeeSub).map((item) => ({
      ...item,
      sub: item.sub ? filterSubItems(item.sub) : undefined,
    }))

  const filtered = menuItems
    .filter((item) => {
      if (item.biddingOnly && user?.role !== 'admin') {
        const hasBiddingPerm = user?.can_issue_bidding_proposals === true
        const hasMenuPerm = item.menuKey ? hasMenuAccess(user, item.menuKey) : false
        if (item.sub.length > 0) {
          return hasBiddingPerm || hasMenuPerm || item.sub.some(canSeeSub)
        }
        return hasBiddingPerm || hasMenuPerm
      }
      if (item.adminOnly && user?.role !== 'admin') return false
      if (item.sub.length > 0) return item.sub.some(canSeeSub)
      if (item.menuKey) return hasMenuAccess(user, item.menuKey)
      return true
    })
    .map((item) => ({ ...item, sub: filterSubItems(item.sub) }))

  return (
    <Sidebar className="border-r-0 bg-brand-sidebar dark:bg-sidebar text-white">
      <SidebarHeader className="flex h-20 items-center justify-center bg-brand-sidebar dark:bg-sidebar p-0 rounded-none mb-2">
        <Link
          to="/"
          className="flex flex-col items-center justify-center p-4 select-none"
          draggable={false}
        >
          <img src={logoUrl} alt="Bener" className="h-10 object-contain bener-logo-invert" />
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-brand-sidebar py-2 text-left">
        <SidebarMenu>
          {filtered.map((item) => {
            const isActive =
              isPathActive(location.pathname, item.url) ||
              hasActiveDescendant(item.sub, location.pathname)
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  {item.sub.length > 0 ? (
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.fullTitle || item.title}
                        className={cn(btnCls, isActive && 'border-l-4 border-brand-green')}
                      >
                        <Link
                          to={item.url}
                          draggable={false}
                          className="select-none flex items-center gap-3 w-full text-sm overflow-hidden"
                        >
                          <item.icon
                            strokeWidth={1.75}
                            className="h-5 w-5 shrink-0"
                            aria-hidden
                            draggable={false}
                          />
                          <span className="flex-1 truncate">{item.title}</span>
                          <ChevronLeft
                            className="h-4 w-4 shrink-0 select-none transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-90 ml-auto"
                            strokeWidth={1.75}
                            draggable={false}
                          />
                        </Link>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  ) : (
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.fullTitle || item.title}
                      className={cn(btnCls, isActive && 'border-l-4 border-brand-green')}
                    >
                      <Link
                        to={item.url}
                        draggable={false}
                        className="select-none flex items-center gap-3 w-full text-sm overflow-hidden"
                      >
                        <item.icon
                          strokeWidth={1.75}
                          className="h-5 w-5 shrink-0"
                          aria-hidden
                          draggable={false}
                        />
                        <span className="flex-1 truncate">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                  {item.sub.length > 0 && (
                    <CollapsibleContent>
                      <SidebarSubMenu items={item.sub} />
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <div className="p-4 mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white rounded-md h-11 transition-colors duration-200 text-sm"
          onClick={() => signOut()}
        >
          <LogOut
            className="mr-3 h-5 w-5 shrink-0 select-none"
            strokeWidth={1.75}
            draggable={false}
          />
          Sair
        </Button>
      </div>
    </Sidebar>
  )
}
