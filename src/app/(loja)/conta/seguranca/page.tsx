import type { Metadata } from 'next'
import Link from 'next/link'
import { ChangePasswordForm } from '@/features/account/change-password-form'
import { getAuthAccount, requireUser } from '@/server/auth/session'

export const metadata: Metadata = { title: 'Segurança' }

export default async function AccountSecurityPage() {
  const user = await requireUser('/conta/seguranca')
  const account = await getAuthAccount(user.uid)
  if (!account.hasPassword || !user.email) {
    return (
      <p className="max-w-xl text-xs leading-relaxed text-muted">
        Você entra com o Google, então a senha é gerenciada pela sua conta Google. Quer usar também
        e-mail e senha?{' '}
        <Link href="/recuperar-senha" className="text-paper underline">
          Crie uma senha
        </Link>{' '}
        pelo link de recuperação.
      </p>
    )
  }
  return <ChangePasswordForm email={user.email} />
}
