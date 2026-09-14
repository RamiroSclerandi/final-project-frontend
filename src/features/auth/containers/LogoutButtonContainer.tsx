import { useAuth } from '../application/useAuth'
import { LogoutButton } from '../components/LogoutButton'

export function LogoutButtonContainer() {
  const { signOut } = useAuth()
  return <LogoutButton onLogout={() => void signOut()} />
}
