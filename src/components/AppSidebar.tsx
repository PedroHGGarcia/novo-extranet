import { Link, useLocation } from 'react-router-dom'
import {
  Monitor,
  Contact,
  CalendarDays,
  FileText,
  Package,
  LineChart,
  UserCircle,
  ChevronRight,
  Globe,
  User,
  Briefcase,
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

const menuItems = [
  { title: 'Painel Principal', url: '/', icon: Monitor, sub: [] },
  {
    title: 'Cadastros',
    url: '/cadastros',
    icon: Contact,
    sub: [
      { title: 'Regiões', url: '/cadastros/regioes', icon: Globe },
      { title: 'Gerentes', url: '/cadastros/gerentes', icon: User },
      { title: 'Clientes', url: '/cadastros/clientes', icon: UserCircle },
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
    url: '/propostas',
    icon: FileText,
    sub: [{ title: 'Histórico', url: '/propostas' }],
  },
  {
    title: 'Controle de Produtos',
    url: '/produtos',
    icon: Package,
    sub: [{ title: 'Estoque', url: '/produtos' }],
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: LineChart,
    sub: [{ title: 'Vendas', url: '/relatorios' }],
  },
  { title: 'Perfil', url: '/perfil', icon: UserCircle, sub: [] },
]

export function AppSidebar() {
  const location = useLocation()

  return (
    <Sidebar className="border-r-0 bg-brand-sidebar text-white">
      <SidebarHeader className="flex h-14 items-center justify-center border-b border-white/5 bg-brand-green p-0 rounded-none">
        <Link to="/" className="flex flex-col items-center justify-center leading-none">
          <span className="text-2xl font-bold tracking-tighter text-white">BENER</span>
          <span className="mt-[2px] text-[8px] uppercase tracking-[0.2em] text-white/80">
            Máquinas que transformam
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="bg-brand-sidebar py-2">
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.url ||
              item.sub.some((sub) => location.pathname === sub.url)

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
                      'h-12 rounded-none text-white/70 hover:bg-white/5 hover:text-white active:bg-brand-green data-[active=true]:bg-brand-green data-[active=true]:text-white data-[active=true]:border-l-4 data-[active=true]:border-brand-success',
                      !isActive && 'border-l-4 border-transparent',
                    )}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

                  {item.sub.length > 0 && (
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="text-white/70 hover:bg-transparent hover:text-white data-[state=open]:rotate-90">
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Toggle Dropdown</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                  )}

                  {item.sub.length > 0 && (
                    <CollapsibleContent>
                      <SidebarMenuSub className="border-l-transparent pr-0 mr-0 gap-1">
                        {item.sub.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={cn(
                                'text-white/70 hover:bg-white/5 hover:text-white flex items-center gap-3 py-2 px-4 rounded-none',
                                location.pathname === subItem.url && 'text-white bg-white/5',
                              )}
                            >
                              <Link to={subItem.url}>
                                {subItem.icon && <subItem.icon className="h-4 w-4 shrink-0" />}
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  )}
                </SidebarMenuItem>
              </Collapsible>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
