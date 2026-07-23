import { useState, ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronsUpDown, Check } from 'lucide-react'

interface MultiSelectRelationProps {
  options: any[]
  value: string[]
  onChange: (value: string[]) => void
  getLabel: (item: any) => string
  placeholder?: string
}

export function MultiSelectRelation({
  options,
  value,
  onChange,
  getLabel,
  placeholder = 'Selecionar...',
}: MultiSelectRelationProps) {
  const [open, setOpen] = useState(false)

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {value.length > 0 ? `${value.length} selecionado(s)` : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="max-h-60 overflow-y-auto p-1">
          {options.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                onClick={() => toggle(item.id)}
              >
                <div className="flex h-4 w-4 items-center justify-center">
                  {value.includes(item.id) && <Check className="h-4 w-4" />}
                </div>
                <span className="text-sm">{getLabel(item)}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
