import { cn } from '@/lib/cn'

export function Spinner({
  size = 'md',
  label = 'Carregando',
}: {
  size?: 'sm' | 'md'
  label?: string
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        size === 'sm' ? 'size-3.5' : 'size-6',
      )}
    />
  )
}
