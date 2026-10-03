import { cn } from '@/lib/cn'

export function Checkbox({
  label,
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'> & { label: React.ReactNode }) {
  return (
    <label className={cn('group flex cursor-pointer items-start gap-3', className)}>
      <input type="checkbox" className="accent-paper mt-0.5" {...props} />
      <span className="text-muted group-hover:text-paper text-[10px] leading-relaxed transition-colors">
        {label}
      </span>
    </label>
  )
}
