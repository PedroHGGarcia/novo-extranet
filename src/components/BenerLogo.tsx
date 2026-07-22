import { cn } from '@/lib/utils'

interface BenerLogoProps {
  className?: string
  variant?: 'full' | 'compact'
}

export function BenerLogo({ className, variant = 'full' }: BenerLogoProps) {
  return (
    <svg
      viewBox="0 0 200 50"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('object-contain', className)}
      role="img"
      aria-label="Bener Máquinas"
    >
      <defs>
        <linearGradient id="bener-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(142, 52%, 30%)" />
          <stop offset="100%" stopColor="hsl(142, 52%, 40%)" />
        </linearGradient>
      </defs>
      <text
        x="0"
        y="36"
        fontFamily="Arial, sans-serif"
        fontSize="34"
        fontWeight="bold"
        fill="url(#bener-grad)"
        letterSpacing="-1"
      >
        BENER
      </text>
      {variant === 'full' && (
        <text
          x="118"
          y="36"
          fontFamily="Arial, sans-serif"
          fontSize="14"
          fontWeight="normal"
          fill="hsl(142, 15%, 45%)"
          letterSpacing="2"
        >
          MÁQUINAS
        </text>
      )}
    </svg>
  )
}
