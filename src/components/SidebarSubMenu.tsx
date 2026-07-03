import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, type LucideIcon } from 'lucide-react'
import { SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface SubMenuItem {
  title: string
  url: string
  icon?: LucideIcon
  menuKey?: string
  fullTitle?: string
  sub?: SubMenuItem[]
  biddingOnly?: boolean
}

function isPathActive(pathname: string, url: string): boolean {
  return pathname === url || pathname.startsWith(url + '/')
}

function hasActiveChild(items: SubMenuItem[] | undefined, pathname: string): boolean {
  if (!items || items.length === 0) return false
  return items.some((s) => isPathActive(pathname, s.url) || hasActiveChild(s.sub, pathname))
}

const subBtnCls =
  'text-white/70 hover:bg-white/5 hover:text-white flex items-center gap-3 py-2 px-4 rounded-none h-10'

export function SidebarSubMenu({ items, level = 0 }: { items: SubMenuItem[]; level?: number }) {
  const location = useLocation()

  return (
    <SidebarMenuSub
      className={cn('border-l-transparent pr-0 mr-0 gap-1', level === 0 ? 'ml-5' : 'ml-4')}
    >
      {items.map((item) => {
        const isActive = isPathActive(location.pathname, item.url)
        const hasChildren = item.sub && item.sub.length > 0
        const isChildActive = hasActiveChild(item.sub, location.pathname)
        const tooltipText = item.fullTitle || item.title

        if (hasChildren) {
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive || isChildActive}
              className="group/sub-collapsible"
            >
              <SidebarMenuSubItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuSubButton
                    asChild
                    className={cn(
                      subBtnCls,
                      (isActive || isChildActive) &&
                        'text-white font-semibold border-l-4 border-brand-green',
                    )}
                  >
                    <Link
                      to={item.url}
                      draggable={false}
                      className="select-none flex items-center gap-3 text-sm overflow-hidden min-w-0"
                    >
                      {item.icon && (
                        <item.icon
                          strokeWidth={1.75}
                          className="h-4 w-4 shrink-0"
                          aria-hidden
                          draggable={false}
                        />
                      )}
                      <span className="truncate flex-1" title={tooltipText}>
                        {item.title}
                      </span>
                      <ChevronLeft
                        className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/sub-collapsible:-rotate-90 ml-auto"
                        strokeWidth={1.75}
                        draggable={false}
                      />
                    </Link>
                  </SidebarMenuSubButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarSubMenu items={item.sub!} level={level + 1} />
                </CollapsibleContent>
              </SidebarMenuSubItem>
            </Collapsible>
          )
        }

        const subBtn = (
          <SidebarMenuSubButton
            asChild
            className={cn(
              subBtnCls,
              isActive && 'text-white font-semibold border-l-4 border-brand-green',
            )}
          >
            <Link
              to={item.url}
              draggable={false}
              className="select-none flex items-center gap-3 text-sm overflow-hidden min-w-0"
            >
              {item.icon && (
                <item.icon
                  strokeWidth={1.75}
                  className="h-4 w-4 shrink-0"
                  aria-hidden
                  draggable={false}
                />
              )}
              <span className="truncate" title={tooltipText}>
                {item.title}
              </span>
            </Link>
          </SidebarMenuSubButton>
        )

        return (
          <SidebarMenuSubItem key={item.title}>
            <Tooltip>
              <TooltipTrigger asChild>{subBtn}</TooltipTrigger>
              <TooltipContent side="right" className="max-w-[220px]">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuSubItem>
        )
      })}
    </SidebarMenuSub>
  )
}
