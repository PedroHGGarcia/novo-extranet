import { ArrowDownUp } from 'lucide-react'
import { TableHead } from '@/components/ui/table'

export function SortableHead({ children }: { children: React.ReactNode }) {
  return (
    <TableHead className="font-semibold text-[#337ab7] hover:text-[#286090] cursor-pointer">
      <div className="flex items-center gap-1 whitespace-nowrap">
        {children}
        <ArrowDownUp className="w-3 h-3 opacity-50" />
      </div>
    </TableHead>
  )
}
