import { cn } from '@/lib/cn'
import { controlClassName } from './input'

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(controlClassName, 'cursor-pointer', className)} {...props} />
}
