import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Columns3 } from 'lucide-react'

export interface ColumnDef {
  id: string
  label: string
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnDef[]
  visibleColumns: string[]
  onToggle: (columnId: string, isVisible: boolean) => void
}

export function ColumnVisibilityDropdown({
  columns,
  visibleColumns,
  onToggle,
}: ColumnVisibilityDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-sm bg-white ml-2">
          <Columns3 className="w-4 h-4 mr-2" /> Colunas
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 rounded-sm" align="end">
        <div className="space-y-2">
          <h4 className="font-medium text-sm mb-2 px-1">Colunas Visíveis</h4>
          {columns.map((col) => (
            <div key={col.id} className="flex items-center space-x-2 px-1">
              <Checkbox
                id={`col-${col.id}`}
                checked={visibleColumns.includes(col.id)}
                onCheckedChange={(checked) => onToggle(col.id, !!checked)}
              />
              <label htmlFor={`col-${col.id}`} className="text-sm cursor-pointer">
                {col.label}
              </label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
