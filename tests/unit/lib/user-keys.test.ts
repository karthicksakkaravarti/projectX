/**
 * Unit Tests: User Keys Module
 */

// Mock dependencies before imports
jest.mock('@/lib/encryption', () => ({
    decryptKey: jest.fn(),
}))

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}))

jest.mock('@/lib/openproviders/env', () => ({
    env: {
        OPENAI_API_KEY: 'env-openai-key',
        MISTRAL_API_KEY: 'env-mistral-key',
        PERPLEXITY_API_KEY: 'env-perplexity-key',
        GOOGLE_GENERATIVE_AI_API_KEY: 'env-google-key',
        ANTHROPIC_API_KEY: 'env-anthropic-key',
        XAI_API_KEY: 'env-xai-key',
        OPENROUTER_API_KEY: 'env-openrouter-key',
    },
}))

import { getUserKey, getEffectiveApiKey } from '@/lib/user-keys'
import { decryptKey } from '@/lib/encryption'
import { createClient } from '@/lib/supabase/server'

describe('lib/user-keys', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getUserKey', () => {
        it('should return decrypted key for valid user', async () => {
            const mockSupabase = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({
                    data: {
                        encrypted_key: 'encrypted123',
                        iv: 'iv123',
                    },
                    error: null,
                }),
            }

            ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)
            ;(decryptKey as jest.Mock).mockReturnValueOnce('decrypted-api-key')

            const result = await getUserKey('user-123', 'openai')

            expect(result).toBe('decrypted-api-key')
            expect(decryptKey).toHaveBeenCalledWith('encrypted123', 'iv123')
        })

        it('should return null if supabase is unavailable', async () => {
            (createClient as jest.Mock).mockResolvedValueOnce(null)

            const result = await getUserKey('user-123', 'openai')

            expect(result).toBeNull()
        })

        it('should return null if no key found', async () => {
            const mockSupabase = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({
                    data: null,
                    error: { message: 'Not found' },
                }),
            }

            ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)

            const result = await getUserKey('user-123', 'openai')

            expect(result).toBeNull()
        })

        it('should return null on error', async () => {
            const mockSupabase = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockRejectedValueOnce(new Error('Database error')),
            }

            ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)

            const result = await getUserKey('user-123', 'openai')

            expect(result).toBeNull()
        })

        it('should query correct provider', async () => {
            const mockSupabase = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({
                    data: {
                        encrypted_key: 'encrypted123',
                        iv: 'iv123',
                    },
                    error: null,
                }),
            }

            ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)
            ;(decryptKey as jest.Mock).mockReturnValueOnce('key')

            await getUserKey('user-456', 'anthropic')

            expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', 'user-456')
            expect(mockSupabase.eq).toHaveBeenCalledWith('provider', 'anthropic')
        })

        it('should handle different providers', async () => {
            const providers = ['openai', 'anthropic', 'google', 'mistral'] as const

            for (const provider of providers) {
                const mockSupabase = {
                    from: jest.fn().mockReturnThis(),
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValueOnce({
                        data: {
                            encrypted_key: `encrypted-${provider}`,
                            iv: `iv-${provider}`,
                        },
                        error: null,
                    }),
                }

                ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)
                ;(decryptKey as jest.Mock).mockReturnValueOnce(`key-${provider}`)

                const result = await getUserKey('user-123', provider)

                expect(result).toBe(`key-${provider}`)
            }
        })
    })

    describe('getEffectiveApiKey', () => {
        it('should return user key if available', async () => {
            const mockSupabase = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({
                    data: {
                        encrypted_key: 'encrypted123',
                        iv: 'iv123',
                    },
                    error: null,
                }),
            }

            ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)
            ;(decryptKey as jest.Mock).mockReturnValueOnce('user-api-key')

            const result = await getEffectiveApiKey('user-123', 'openai')

            expect(result).toBe('user-api-key')
        })

        it('should fallback to env key if no user key', async () => {
            const mockSupabase = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({
                    data: null,
                    error: { message: 'Not found' },
                }),
            }

            ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)

            const result = await getEffectiveApiKey('user-123', 'openai')

            expect(result).toBe('env-openai-key')
        })

        it('should return env key if userId is null', async () => {
            const result = await getEffectiveApiKey(null, 'mistral')

            expect(result).toBe('env-mistral-key')
            expect(createClient).not.toHaveBeenCalled()
        })

        it('should return correct env keys for each provider', async () => {
            const expectedKeys = {
                openai: 'env-openai-key',
                mistral: 'env-mistral-key',
                perplexity: 'env-perplexity-key',
                google: 'env-google-key',
                anthropic: 'env-anthropic-key',
                xai: 'env-xai-key',
                openrouter: 'env-openrouter-key',
            }

            for (const [provider, expectedKey] of Object.entries(expectedKeys)) {
                const result = await getEffectiveApiKey(null, provider as any)
                expect(result).toBe(expectedKey)
            }
        })

        it('should prefer user key over env key', async () => {
            const mockSupabase = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValueOnce({
                    data: {
                        encrypted_key: 'encrypted-user-key',
                        iv: 'iv-user',
                    },
                    error: null,
                }),
            }

            ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)
            ;(decryptKey as jest.Mock).mockReturnValueOnce('user-custom-key')

            const result = await getEffectiveApiKey('user-123', 'openai')

            expect(result).toBe('user-custom-key')
            expect(result).not.toBe('env-openai-key')
        })

        it('should handle user key retrieval errors gracefully', async () => {
            const mockSupabase = {
                from: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockRejectedValueOnce(new Error('DB error')),
            }

            ;(createClient as jest.Mock).mockResolvedValueOnce(mockSupabase)

            const result = await getEffectiveApiKey('user-123', 'anthropic')

            expect(result).toBe('env-anthropic-key')
        })
    })
})
