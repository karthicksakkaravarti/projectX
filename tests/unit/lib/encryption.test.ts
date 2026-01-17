/**
 * Unit Tests: Encryption Module
 */

// Set environment variable BEFORE importing the module
process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64')

import { encryptKey, decryptKey, maskKey } from '@/lib/encryption'

describe('lib/encryption', () => {
    describe('encryptKey', () => {
        it('should encrypt a plaintext string', () => {
            const plaintext = 'my-secret-api-key'
            const result = encryptKey(plaintext)

            expect(result).toHaveProperty('encrypted')
            expect(result).toHaveProperty('iv')
            expect(typeof result.encrypted).toBe('string')
            expect(typeof result.iv).toBe('string')
            expect(result.encrypted).not.toBe(plaintext)
        })

        it('should produce different IV each time', () => {
            const plaintext = 'my-secret-key'
            const result1 = encryptKey(plaintext)
            const result2 = encryptKey(plaintext)

            expect(result1.iv).not.toBe(result2.iv)
            expect(result1.encrypted).not.toBe(result2.encrypted)
        })

        it('should include auth tag in encrypted data', () => {
            const plaintext = 'test-key'
            const result = encryptKey(plaintext)

            // Auth tag is appended after a colon
            expect(result.encrypted).toContain(':')
            const parts = result.encrypted.split(':')
            expect(parts.length).toBe(2)
            expect(parts[0].length).toBeGreaterThan(0)
            expect(parts[1].length).toBeGreaterThan(0)
        })

        it('should handle empty string', () => {
            const result = encryptKey('')

            expect(result).toHaveProperty('encrypted')
            expect(result).toHaveProperty('iv')
        })

        it('should handle long strings', () => {
            const plaintext = 'a'.repeat(1000)
            const result = encryptKey(plaintext)

            expect(result).toHaveProperty('encrypted')
            expect(result).toHaveProperty('iv')
        })

        it('should handle special characters', () => {
            const plaintext = 'sk-proj-!@#$%^&*()_+-=[]{}|;:,.<>?'
            const result = encryptKey(plaintext)

            expect(result).toHaveProperty('encrypted')
            expect(result).toHaveProperty('iv')
        })
    })

    describe('decryptKey', () => {
        it('should decrypt an encrypted key', () => {
            const plaintext = 'my-secret-api-key'
            const { encrypted, iv } = encryptKey(plaintext)
            const decrypted = decryptKey(encrypted, iv)

            expect(decrypted).toBe(plaintext)
        })

        it('should decrypt empty string', () => {
            const plaintext = ''
            const { encrypted, iv } = encryptKey(plaintext)
            const decrypted = decryptKey(encrypted, iv)

            expect(decrypted).toBe(plaintext)
        })

        it('should decrypt long strings', () => {
            const plaintext = 'x'.repeat(500)
            const { encrypted, iv } = encryptKey(plaintext)
            const decrypted = decryptKey(encrypted, iv)

            expect(decrypted).toBe(plaintext)
        })

        it('should decrypt special characters', () => {
            const plaintext = '!@#$%^&*()_+-=[]{}|;:,.<>?'
            const { encrypted, iv } = encryptKey(plaintext)
            const decrypted = decryptKey(encrypted, iv)

            expect(decrypted).toBe(plaintext)
        })

        it('should throw error with wrong IV', () => {
            const plaintext = 'test-key'
            const { encrypted } = encryptKey(plaintext)
            const wrongIv = 'a'.repeat(32)

            expect(() => {
                decryptKey(encrypted, wrongIv)
            }).toThrow()
        })

        it('should throw error with tampered encrypted data', () => {
            const plaintext = 'test-key'
            const { encrypted, iv } = encryptKey(plaintext)
            const tampered = 'aaaa' + encrypted.slice(4)

            expect(() => {
                decryptKey(tampered, iv)
            }).toThrow()
        })

        it('should throw error with tampered auth tag', () => {
            const plaintext = 'test-key'
            const { encrypted, iv } = encryptKey(plaintext)
            const [data, authTag] = encrypted.split(':')
            const tamperedAuthTag = 'aaaa' + authTag.slice(4)
            const tampered = `${data}:${tamperedAuthTag}`

            expect(() => {
                decryptKey(tampered, iv)
            }).toThrow()
        })

        it('should throw error with missing auth tag', () => {
            const plaintext = 'test-key'
            const { encrypted, iv } = encryptKey(plaintext)
            const [data] = encrypted.split(':')

            expect(() => {
                decryptKey(data, iv)
            }).toThrow()
        })
    })

    describe('maskKey', () => {
        it('should mask a standard API key', () => {
            const key = 'sk-proj-1234567890abcdefghij'
            const masked = maskKey(key)

            expect(masked).toBe('sk-p***************ghij')
            expect(masked.length).toBe(key.length)
        })

        it('should show first 4 and last 4 characters', () => {
            const key = 'abcdefghijklmnop'
            const masked = maskKey(key)

            expect(masked.startsWith('abcd')).toBe(true)
            expect(masked.endsWith('mnop')).toBe(true)
            expect(masked).toContain('*')
        })

        it('should fully mask short keys (8 chars or less)', () => {
            const key = '12345678'
            const masked = maskKey(key)

            expect(masked).toBe('********')
            expect(masked).not.toContain('1')
            expect(masked).not.toContain('8')
        })

        it('should fully mask very short keys', () => {
            const key = 'abc'
            const masked = maskKey(key)

            expect(masked).toBe('***')
        })

        it('should handle exactly 9 characters', () => {
            const key = '123456789'
            const masked = maskKey(key)

            expect(masked.startsWith('1234')).toBe(true)
            expect(masked.endsWith('6789')).toBe(true)
            expect(masked).toBe('1234*6789')
        })

        it('should mask long keys correctly', () => {
            const key = 'a'.repeat(100)
            const masked = maskKey(key)

            expect(masked.startsWith('aaaa')).toBe(true)
            expect(masked.endsWith('aaaa')).toBe(true)
            expect(masked.length).toBe(100)
        })

        it('should handle single character', () => {
            const key = 'x'
            const masked = maskKey(key)

            expect(masked).toBe('*')
        })

        it('should handle empty string', () => {
            const key = ''
            const masked = maskKey(key)

            expect(masked).toBe('')
        })
    })

    describe('encryption roundtrip', () => {
        it('should maintain data integrity through encrypt/decrypt cycle', () => {
            const testCases = [
                'simple-key',
                'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz',
                '!@#$%^&*()_+-=[]{}|;:,.<>?',
                'unicode-测试-🔐',
                '',
                'a'.repeat(1000),
            ]

            testCases.forEach((plaintext) => {
                const { encrypted, iv } = encryptKey(plaintext)
                const decrypted = decryptKey(encrypted, iv)
                expect(decrypted).toBe(plaintext)
            })
        })
    })
})
