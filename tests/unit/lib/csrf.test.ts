/**
 * Unit Tests: CSRF Module
 */

import { generateCsrfToken, validateCsrfToken } from '@/lib/csrf'

// Set environment variable for testing
process.env.CSRF_SECRET = 'test-secret-key-for-csrf'

describe('lib/csrf', () => {
    describe('generateCsrfToken', () => {
        it('should generate a token', () => {
            const token = generateCsrfToken()

            expect(typeof token).toBe('string')
            expect(token.length).toBeGreaterThan(0)
        })

        it('should generate token with raw:hash format', () => {
            const token = generateCsrfToken()

            expect(token).toContain(':')
            const parts = token.split(':')
            expect(parts.length).toBe(2)
            expect(parts[0].length).toBeGreaterThan(0)
            expect(parts[1].length).toBeGreaterThan(0)
        })

        it('should generate unique tokens', () => {
            const token1 = generateCsrfToken()
            const token2 = generateCsrfToken()
            const token3 = generateCsrfToken()

            expect(token1).not.toBe(token2)
            expect(token2).not.toBe(token3)
            expect(token1).not.toBe(token3)
        })

        it('should generate tokens with consistent hash length', () => {
            const token1 = generateCsrfToken()
            const token2 = generateCsrfToken()

            const hash1 = token1.split(':')[1]
            const hash2 = token2.split(':')[1]

            expect(hash1.length).toBe(hash2.length)
            expect(hash1.length).toBe(64) // SHA-256 produces 64 hex characters
        })

        it('should generate tokens with consistent raw length', () => {
            const token1 = generateCsrfToken()
            const token2 = generateCsrfToken()

            const raw1 = token1.split(':')[0]
            const raw2 = token2.split(':')[0]

            expect(raw1.length).toBe(raw2.length)
            expect(raw1.length).toBe(64) // 32 bytes = 64 hex characters
        })
    })

    describe('validateCsrfToken', () => {
        it('should validate a valid token', () => {
            const token = generateCsrfToken()
            const isValid = validateCsrfToken(token)

            expect(isValid).toBe(true)
        })

        it('should reject tampered token hash', () => {
            const token = generateCsrfToken()
            const [raw, hash] = token.split(':')
            const tamperedToken = `${raw}:${hash}abc`

            const isValid = validateCsrfToken(tamperedToken)

            expect(isValid).toBe(false)
        })

        it('should reject tampered token raw part', () => {
            const token = generateCsrfToken()
            const [raw, hash] = token.split(':')
            const tamperedToken = `${raw}abc:${hash}`

            const isValid = validateCsrfToken(tamperedToken)

            expect(isValid).toBe(false)
        })

        it('should reject token without colon', () => {
            const isValid = validateCsrfToken('invalidtoken')

            expect(isValid).toBe(false)
        })

        it('should reject empty token', () => {
            const isValid = validateCsrfToken('')

            expect(isValid).toBe(false)
        })

        it('should reject token with only colon', () => {
            const isValid = validateCsrfToken(':')

            expect(isValid).toBe(false)
        })

        it('should reject token with missing raw part', () => {
            const isValid = validateCsrfToken(':hashpart')

            expect(isValid).toBe(false)
        })

        it('should reject token with missing hash part', () => {
            const isValid = validateCsrfToken('rawpart:')

            expect(isValid).toBe(false)
        })

        it('should reject completely invalid token', () => {
            const isValid = validateCsrfToken('totally-invalid-token')

            expect(isValid).toBe(false)
        })

        it('should reject random string', () => {
            const isValid = validateCsrfToken('a'.repeat(100))

            expect(isValid).toBe(false)
        })

        it('should handle multiple valid tokens independently', () => {
            const token1 = generateCsrfToken()
            const token2 = generateCsrfToken()
            const token3 = generateCsrfToken()

            expect(validateCsrfToken(token1)).toBe(true)
            expect(validateCsrfToken(token2)).toBe(true)
            expect(validateCsrfToken(token3)).toBe(true)
        })

        it('should not validate one token as another', () => {
            const token1 = generateCsrfToken()
            const token2 = generateCsrfToken()

            const [raw1] = token1.split(':')
            const [, hash2] = token2.split(':')
            const mixedToken = `${raw1}:${hash2}`

            expect(validateCsrfToken(mixedToken)).toBe(false)
        })
    })

    describe('CSRF protection integration', () => {
        it('should generate and validate token correctly', () => {
            const token = generateCsrfToken()
            const isValid = validateCsrfToken(token)

            expect(isValid).toBe(true)
        })

        it('should work with multiple generate/validate cycles', () => {
            for (let i = 0; i < 10; i++) {
                const token = generateCsrfToken()
                expect(validateCsrfToken(token)).toBe(true)
            }
        })
    })
})
