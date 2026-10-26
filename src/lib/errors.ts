export function getErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : ''
  if (code.includes('email-already-in-use')) return 'An account already uses this email address.'
  if (code.includes('invalid-credential')) return 'The email or password is incorrect.'
  if (code.includes('weak-password')) return 'Use a stronger password with at least eight characters.'
  if (code.includes('too-many-requests')) return 'Too many attempts. Please wait and try again.'
  if (code.includes('permission-denied')) return 'You do not have permission to access that classroom record.'
  if (code.includes('unavailable')) return 'The service is unavailable. Check your connection or local emulators.'
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
