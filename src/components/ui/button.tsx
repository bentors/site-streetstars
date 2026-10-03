import { cn } from '@/lib/cn'
import { Spinner } from './spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-paper text-ink hover:bg-zinc-200',
  secondary: 'border border-line text-paper hover:border-paper',
  ghost: 'text-muted hover:text-paper',
  danger: 'bg-danger text-ink hover:brightness-110',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[10px]',
  md: 'h-11 px-5 text-xs',
  lg: 'h-14 px-8 text-sm',
}

export type ButtonProps = React.ComponentProps<'button'> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-black tracking-[0.2em] uppercase transition-colors',
        'focus-visible:outline-paper focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  )
}
