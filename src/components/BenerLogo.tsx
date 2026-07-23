import { cn } from '@/lib/utils'
import logoUrl from '@/assets/editedimage1784831163387-1-747be.png'

interface BenerLogoProps {
  className?: string
  variant?: 'full' | 'compact'
}

export function BenerLogo({ className, variant = 'full' }: BenerLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="Bener Máquinas"
      className={cn('object-contain', className)}
      draggable={false}
    />
  )
}
