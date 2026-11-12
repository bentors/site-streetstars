import { cn } from '@/lib/cn'

export const controlClassName =
  'w-full border border-line bg-surface p-3 font-mono text-sm text-paper outline-none transition-colors placeholder:text-zinc-700 focus:border-paper aria-invalid:border-danger disabled:opacity-50'

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(controlClassName, className)} {...props} />
}
