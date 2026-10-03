import Link from 'next/link'
import { Logo } from '@/components/brand/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
      />
      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <Link href="/" className="mb-10 transition-opacity hover:opacity-80">
          <Logo className="h-12 w-auto text-paper md:h-16" />
        </Link>
        {children}
      </div>
    </div>
  )
}
