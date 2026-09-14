export interface LogoutButtonProps {
  onLogout: () => void
}

export function LogoutButton({ onLogout }: LogoutButtonProps) {
  return (
    <button type="button" onClick={onLogout}>
      Log out
    </button>
  )
}
