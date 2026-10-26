export function isLocalTestMode(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem('grow_build_test_mode')
  if (stored !== null) return stored === 'true'
  // Default to local testing mode so the user can test everything without deploying rules
  const envSetting = import.meta.env.VITE_LOCAL_TEST_MODE
  if (envSetting === 'false') return false
  return true
}

export function setLocalTestMode(enabled: boolean) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('grow_build_test_mode', enabled ? 'true' : 'false')
    window.location.reload()
  }
}
