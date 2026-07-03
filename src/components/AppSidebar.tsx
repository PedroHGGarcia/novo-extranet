import { Link, useLocation } from 'react-router-dom'
import logoUrl from '@/assets/systemlogoin-large-52274.png'
import {
  Monitor,
  Map,
  Folder,
  FolderKanban,
  CalendarDays,
  FileText,
  Boxes,
  BarChart3,
  LineChart,
  UserCircle,
  ChevronLeft,
  Globe,
  User,
  Briefcase,
  Users,
  Activity,
  Settings,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { hasMenuAccess } from '@/lib/menu-access'

interface SubItem {
  title: string
  url: string
  icon?: any
  menuKey?: string
}
interface MenuItem {
  title: string
  url: string
  icon: any
  sub: SubItem[]
  menuKey?: string
  adminOnly?: boolean
  biddingOnly?: boolean
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
    title: 'Dashboard de Licitações',
    url: '/controle-propostas/dashboard-licitacoes',
    icon: FolderKanban,
    biddingOnly: true,
    sub: [],
  },
  {
    title: 'Controle de Eventos',
    url: '/eventos',
    icon: CalendarDays,
    menuKey: 'eventos',
    sub: [{ title: 'Agenda', url: '/eventos', menuKey: 'eventos' }],
  },
  {
    title: 'Controle de Propostas',
    url: '/controle-propostas',
    icon: FileText,
    sub: [
      { title: 'Dashboard', url: '/controle-propostas/dashboard', menuKey: 'propostas' },
      {
        title: 'Emitir Proposta',
        url: '/controle-propostas/emitir-proposta',
        menuKey: 'emitir_proposta',
      },
      {
        title: 'Emitir Proposta de Licitação',
        url: '/controle-propostas/emitir-licitacao',
        menuKey: 'emitir_licitacao',
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
  { title: 'Permissões', url: '/permissoes', icon: ShieldCheck, sub: [], adminOnly: true },
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

export function AppSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const canSeeSub = (s: SubItem): boolean => {
    if (s.menuKey === 'emitir_licitacao') {
      return (
        (user?.role === 'admin' || user?.can_issue_bidding_proposals === true) &&
        hasMenuAccess(user, 'emitir_licitacao')
      )
    }
    if (!s.menuKey) return true
    return hasMenuAccess(user, s.menuKey)
  }

  const filtered = menuItems
    .filter((item) => {
      if (item.biddingOnly) {
        return user?.role === 'admin' || user?.can_issue_bidding_proposals === true
      }
      if (item.adminOnly && user?.role !== 'admin') return false
      if (item.sub.length > 0) return item.sub.some(canSeeSub)
      if (item.menuKey) return hasMenuAccess(user, item.menuKey)
      return true
    })
    .map((item) => ({ ...item, sub: item.sub.filter(canSeeSub) }))

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
              location.pathname === item.url ||
              item.sub.some((s) => location.pathname.startsWith(s.url))
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
                        className={cn(btnCls, isActive && 'border-l-4 border-brand-green')}
                      >
                        <Link
                          to={item.url}
                          draggable={false}
                          className="select-none flex items-center gap-3 w-full text-sm"
                        >
                          <item.icon
                            strokeWidth={1.75}
                            className="h-5 w-5 shrink-0"
                            aria-hidden
                            draggable={false}
                          />
                          <span className="flex-1">{item.title}</span>
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
                      className={cn(btnCls, isActive && 'border-l-4 border-brand-green')}
                    >
                      <Link
                        to={item.url}
                        draggable={false}
                        className="select-none flex items-center gap-3 w-full text-sm"
                      >
                        <item.icon
                          strokeWidth={1.75}
                          className="h-5 w-5 shrink-0"
                          aria-hidden
                          draggable={false}
                        />
                        <span className="flex-1">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                  {item.sub.length > 0 && (
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l-transparent pr-0 mr-0 gap-1 ml-5">
                        {item.sub.map((s) => {
                          const isSubActive = location.pathname.startsWith(s.url)
                          return (
                            <SidebarMenuSubItem key={s.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  'text-white/70 hover:bg-white/5 hover:text-white flex items-center gap-3 py-2 px-4 rounded-none h-10',
                                  isSubActive &&
                                    'text-white font-semibold border-l-4 border-brand-green',
                                )}
                              >
                                <Link
                                  to={s.url}
                                  draggable={false}
                                  className="select-none flex items-center gap-3 text-sm"
                                >
                                  {s.icon && (
                                    <s.icon
                                      strokeWidth={1.75}
                                      className="h-4 w-4 shrink-0"
                                      aria-hidden
                                      draggable={false}
                                    />
                                  )}
                                  <span>{s.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
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
