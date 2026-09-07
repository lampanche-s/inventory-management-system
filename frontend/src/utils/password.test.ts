import { describe, expect, it } from 'vitest'
import {
  BCRYPT_MAX_PASSWORD_BYTES,
  exceedsBcryptPasswordLimit,
  passwordUtf8Length,
} from './password'

describe('password BCrypt compatibility', () => {
  it('uses the 72-byte UTF-8 boundary rather than character count', () => {
    expect(BCRYPT_MAX_PASSWORD_BYTES).toBe(72)

    expect(passwordUtf8Length('a'.repeat(72))).toBe(72)
    expect(exceedsBcryptPasswordLimit('a'.repeat(72))).toBe(false)
    expect(exceedsBcryptPasswordLimit('a'.repeat(73))).toBe(true)

    expect(passwordUtf8Length(`${'a'.repeat(68)}😀`)).toBe(72)
    expect(exceedsBcryptPasswordLimit(`${'a'.repeat(68)}😀`)).toBe(false)
    expect(passwordUtf8Length(`${'a'.repeat(69)}😀`)).toBe(73)
    expect(exceedsBcryptPasswordLimit(`${'a'.repeat(69)}😀`)).toBe(true)
  })
})
