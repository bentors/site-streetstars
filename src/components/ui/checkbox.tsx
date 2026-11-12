import { cn } from '@/lib/cn'

export function Checkbox({
  label,
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'> & { label: React.ReactNode }) {
  return (
    <label className={cn('group flex cursor-pointer items-start gap-3', className)}>
      <input type="checkbox" className="mt-0.5 accent-paper" {...props} />
      <span className="text-[10px] leading-relaxed text-muted transition-colors group-hover:text-paper">
        {label}
      </span>
    </label>
  )
}
