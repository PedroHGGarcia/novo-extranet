import { ArrowDownUp } from 'lucide-react'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface SortableHeadProps {
  children?: React.ReactNode
  label?: string
  className?: string
  sortKey?: string
  currentSort?: string
  onSort?: () => void
}

export function SortableHead({
  children,
  label,
  className,
  sortKey,
  currentSort,
  onSort,
}: SortableHeadProps) {
  return (
    <TableHead
      className={cn('font-medium cursor-pointer hover:text-foreground', className)}
      onClick={onSort}
    >
      <div className="flex items-center gap-1 whitespace-nowrap">
        {label || children}
        <ArrowDownUp className="w-3 h-3 opacity-50" />
      </div>
    </TableHead>
  )
}
