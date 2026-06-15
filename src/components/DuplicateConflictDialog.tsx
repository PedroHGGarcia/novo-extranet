import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DuplicateConflictDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReplace: () => void
  onMerge: () => void
  isSubmitting?: boolean
}

export function DuplicateConflictDialog({
  open,
  onOpenChange,
  onReplace,
  onMerge,
  isSubmitting,
}: DuplicateConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Documento já cadastrado</DialogTitle>
          <DialogDescription>
            Este CPF/CNPJ já está registrado no sistema. Você deseja substituir os dados existentes
            com os novos ou mesclar as informações (preservando o que não foi preenchido)?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={onMerge} disabled={isSubmitting}>
            Mesclar Dados
          </Button>
          <Button onClick={onReplace} disabled={isSubmitting}>
            Substituir Tudo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
