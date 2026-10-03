import { Button } from '@/components/ui'
import { signOutAction } from './actions'

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm">
        Sair
      </Button>
    </form>
  )
}
