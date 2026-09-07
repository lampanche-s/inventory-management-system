export const BCRYPT_MAX_PASSWORD_BYTES = 72

export function passwordUtf8Length(password: string): number {
  return new TextEncoder().encode(password).length
}

export function exceedsBcryptPasswordLimit(password: string): boolean {
  return passwordUtf8Length(password) > BCRYPT_MAX_PASSWORD_BYTES
}
