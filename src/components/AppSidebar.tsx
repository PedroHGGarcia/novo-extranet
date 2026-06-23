import { Link, useLocation } from 'react-router-dom'
import {
  Monitor,
  Map,
  Folder,
  CalendarDays,
  FileText,
  Boxes,
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
  SidebarMenuAction,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

const menuItems = [
  { title: 'Painel Principal', url: '/dashboard', icon: Monitor, sub: [] },
  {
    title: 'Cadastros',
    url: '/cadastros',
    icon: Folder,
    sub: [
      { title: 'Gerentes', url: '/cadastros/gerentes', icon: User },
      { title: 'Clientes', url: '/cadastros/clientes', icon: Users },
      { title: 'Regiões', url: '/cadastros/regioes', icon: Globe },
      { title: 'Representantes', url: '/cadastros/representantes', icon: Briefcase },
      { title: 'Prepostos', url: '/cadastros/prepostos', icon: Briefcase },
    ],
  },
  {
    title: 'Controle de Eventos',
    url: '/eventos',
    icon: CalendarDays,
    sub: [{ title: 'Agenda', url: '/eventos' }],
  },
  {
    title: 'Controle de Propostas',
    url: '/controle-propostas',
    icon: FileText,
    sub: [
      { title: 'Emitir Proposta', url: '/controle-propostas/emitir-proposta' },
      { title: 'Tipos de Propostas', url: '/controle-propostas/tipos-propostas' },
      { title: 'Assinaturas', url: '/controle-propostas/assinaturas' },
      { title: 'Cotações', url: '/controle-propostas/cotacoes' },
      { title: 'Propostas Excluídas', url: '/controle-propostas/propostas-excluidas' },
      { title: 'Tipo de Documentos', url: '/controle-propostas/tipo-documentos' },
      { title: 'Formas de Pagamento', url: '/controle-propostas/formas-pagamento' },
    ],
  },
  {
    title: 'Controle de Produtos',
    url: '/produtos',
    icon: Boxes,
    sub: [
      { title: 'Categorias', url: '/produtos/categorias' },
      { title: 'Produtos', url: '/produtos' },
      { title: 'Marcas', url: '/produtos/marcas' },
      { title: 'Modelos', url: '/produtos/modelos' },
      { title: 'Versões', url: '/produtos/versoes' },
      { title: 'Versão Imagens', url: '/produtos/versao-imagens' },
      { title: 'Acessórios', url: '/produtos/acessorios' },
      { title: 'Alterar Preços', url: '/produtos/alterar-precos' },
      { title: 'Hierarquia de Versões', url: '/produtos/hierarquia-versoes' },
      { title: 'Versões Excluídas', url: '/produtos/versoes-excluidas' },
    ],
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: LineChart,
    sub: [{ title: 'Vendas', url: '/relatorios' }],
  },
  { title: 'Perfil', url: '/perfil', icon: UserCircle, sub: [] },
  { title: 'Área de Atuação de Representantes', url: '/area-atuacao', icon: Map, sub: [] },
  { title: 'Usuários', url: '/usuarios', icon: Users, sub: [], adminOnly: true },
  { title: 'Logs de Auditoria', url: '/auditoria', icon: Activity, sub: [], adminOnly: true },
  { title: 'Configurações', url: '/configuracoes', icon: Settings, sub: [], adminOnly: true },
]

export function AppSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  return (
    <Sidebar className="border-r-0 bg-brand-sidebar text-white">
      <SidebarHeader className="flex h-24 items-center justify-center bg-brand-sidebar p-0 rounded-none mb-2">
        <Link
          to="/"
          className="flex flex-col items-center justify-center p-4 select-none"
          draggable={false}
        >
          <h1 className="text-3xl font-black tracking-widest text-white">BENER</h1>
          <p className="text-[0.55rem] font-bold tracking-[0.2em] text-white uppercase mt-1">
            Máquinas que transformam
          </p>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-brand-sidebar py-2 text-left">
        <SidebarMenu>
          {menuItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null

            const isActive =
              location.pathname === item.url ||
              item.sub.some((sub) => location.pathname.startsWith(sub.url))

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={cn(
                      'h-11 rounded-none text-white/80 hover:bg-white/5 hover:text-white active:bg-white/10 data-[active=true]:bg-white/5 data-[active=true]:text-white data-[active=true]:font-semibold',
                      isActive && 'border-l-4 border-brand-green',
                    )}
                  >
                    <Link
                      to={item.url}
                      draggable={false}
                      className="select-none flex items-center gap-3 w-full"
                    >
                      <item.icon className="h-5 w-5 select-none shrink-0" draggable={false} />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  {item.sub.length > 0 && (
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="text-white/80 hover:bg-white/10 hover:text-white">
                        <ChevronLeft
                          className="h-4 w-4 select-none transition-transform duration-200 group-data-[state=open]/collapsible:-rotate-90"
                          draggable={false}
                        />
                        <span className="sr-only">Toggle Dropdown</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                  )}

                  {item.sub.length > 0 && (
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l-transparent pr-0 mr-0 gap-1 ml-5">
                        {item.sub.map((subItem) => {
                          const isSubActive = location.pathname.startsWith(subItem.url)
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton
                                asChild
                                className={cn(
                                  'text-white/70 hover:bg-white/5 hover:text-white flex items-center gap-3 py-2 px-4 rounded-none h-10',
                                  isSubActive &&
                                    'text-white font-semibold border-l-4 border-brand-green',
                                )}
                              >
                                <Link to={subItem.url} draggable={false} className="select-none">
                                  {subItem.icon && (
                                    <subItem.icon
                                      className="h-4 w-4 shrink-0 select-none"
                                      draggable={false}
                                    />
                                  )}
                                  <span>{subItem.title}</span>
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
          className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white rounded-md h-11 transition-colors"
          onClick={() => signOut()}
        >
          <LogOut className="mr-3 h-5 w-5 select-none" draggable={false} />
          Sair
        </Button>
      </div>
    </Sidebar>
  )
}
