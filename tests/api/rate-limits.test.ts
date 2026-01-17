/**
 * API Tests: Rate Limits Logic
 */

import { checkDailyMessageLimit, checkProModelLimit } from '@/lib/usage'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    gte: jest.fn().mockReturnValue({
                        maybeSingle: jest.fn().mockResolvedValue({
                            data: { count: 5 },
                            error: null,
                        }),
                    }),
                }),
            }),
        }),
    }),
}))

describe('Rate Limits Logic', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('checkDailyMessageLimit', () => {
        it('should return allowed=true when under limit', async () => {
            const result = await checkDailyMessageLimit('test-user', true)

            expect(result).toHaveProperty('allowed')
            expect(result).toHaveProperty('remaining')
            expect(result).toHaveProperty('limit')
            expect(result).toHaveProperty('resetTime')
            expect(result.allowed).toBe(true)
        })

        it('should have higher limit for authenticated users', async () => {
            const authResult = await checkDailyMessageLimit('auth-user', true)
            const guestResult = await checkDailyMessageLimit('guest-user', false)

            expect(authResult.limit).toBeGreaterThan(guestResult.limit)
        })
    })

    describe('checkProModelLimit', () => {
        it('should return allowed=true when under pro model limit', async () => {
            const result = await checkProModelLimit('test-user')

            expect(result).toHaveProperty('allowed')
            expect(result).toHaveProperty('remaining')
            expect(result).toHaveProperty('limit')
            expect(result).toHaveProperty('resetTime')
            expect(result.allowed).toBe(true)
        })

        it('should have a specific limit for pro models', async () => {
            const result = await checkProModelLimit('test-user')

            expect(result.limit).toBeGreaterThan(0)
            expect(typeof result.limit).toBe('number')
        })
    })
})
