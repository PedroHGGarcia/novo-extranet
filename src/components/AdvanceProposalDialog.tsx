import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = ['Em Análise', 'Aprovada', 'Recusada', 'Excluída']

interface AdvanceProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  proposta: any
  novoStatus: string
  onStatusChange: (status: string) => void
  onConfirm: () => void
}

export function AdvanceProposalDialog({
  open,
  onOpenChange,
  proposta,
  novoStatus,
  onStatusChange,
  onConfirm,
}: AdvanceProposalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Avançar Proposta</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-slate-600 mb-4">
            Selecione o novo status para a proposta{' '}
            <strong className="text-slate-900">{proposta?.numero_proposta}</strong>:
          </p>
          <div className="flex bg-slate-100 rounded-sm p-1 gap-1 border border-slate-200">
            {STATUS_OPTIONS.map((statusOption) => {
              const isSelected = novoStatus === statusOption
              return (
                <button
                  key={statusOption}
                  onClick={() => onStatusChange(statusOption)}
                  className={cn(
                    'flex-1 text-[11px] font-medium py-1.5 rounded-sm transition-all',
                    isSelected
                      ? statusOption === 'Aprovada'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : statusOption === 'Recusada'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : statusOption === 'Excluída'
                            ? 'bg-slate-500 text-white shadow-sm'
                            : 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-200 hover:shadow-sm',
                  )}
                >
                  {statusOption}
                </button>
              )
            })}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700 text-white">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
