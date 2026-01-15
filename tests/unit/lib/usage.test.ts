/**
 * Unit Tests: Usage Module
 */

import {
    checkUsage,
    incrementUsage,
    checkProUsage,
    incrementProUsage,
} from '@/lib/usage'
import { UsageLimitError } from '@/lib/api'

// Mock Supabase
const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
}

describe('lib/usage', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('checkUsage', () => {
        it('should return usage data for authenticated user under limit', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    message_count: 50,
                    daily_message_count: 5,
                    daily_reset: new Date().toISOString(),
                    anonymous: false,
                    premium: false,
                },
                error: null,
            })

            const result = await checkUsage(mockSupabase as any, 'user-123')

            expect(result).toHaveProperty('userData')
            expect(result).toHaveProperty('dailyCount')
            expect(result).toHaveProperty('dailyLimit')
            expect(result.dailyCount).toBe(5)
            expect(result.dailyLimit).toBe(1000)
        })

        it('should return usage data for guest user under limit', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    message_count: 3,
                    daily_message_count: 3,
                    daily_reset: new Date().toISOString(),
                    anonymous: true,
                    premium: false,
                },
                error: null,
            })

            const result = await checkUsage(mockSupabase as any, 'guest-456')

            expect(result).toHaveProperty('userData')
            expect(result).toHaveProperty('dailyCount')
            expect(result).toHaveProperty('dailyLimit')
            expect(result.dailyCount).toBe(3)
            expect(result.dailyLimit).toBe(5)
        })

        it('should throw error when daily limit reached for guest', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    message_count: 5,
                    daily_message_count: 5,
                    daily_reset: new Date().toISOString(),
                    anonymous: true,
                    premium: false,
                },
                error: null,
            })

            await expect(
                checkUsage(mockSupabase as any, 'guest-456')
            ).rejects.toThrow(UsageLimitError)
        })

        it('should throw error when daily limit reached for auth user', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    message_count: 1000,
                    daily_message_count: 1000,
                    daily_reset: new Date().toISOString(),
                    anonymous: false,
                    premium: false,
                },
                error: null,
            })

            await expect(
                checkUsage(mockSupabase as any, 'user-123')
            ).rejects.toThrow(UsageLimitError)
        })

        it('should reset daily count when new day', async () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    message_count: 50,
                    daily_message_count: 100,
                    daily_reset: yesterday.toISOString(),
                    anonymous: false,
                    premium: false,
                },
                error: null,
            })

            mockSupabase.update.mockResolvedValueOnce({ error: null })

            const result = await checkUsage(mockSupabase as any, 'user-123')

            expect(result.dailyCount).toBe(0)
            expect(mockSupabase.update).toHaveBeenCalled()
        })

        it('should throw error if user not found', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null,
            })

            await expect(
                checkUsage(mockSupabase as any, 'nonexistent')
            ).rejects.toThrow('User record not found')
        })

        it('should throw error if database error', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: { message: 'Database error' },
            })

            await expect(
                checkUsage(mockSupabase as any, 'user-123')
            ).rejects.toThrow('Error fetchClienting user data')
        })
    })

    describe('incrementUsage', () => {
        it('should increment message counts', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    message_count: 10,
                    daily_message_count: 5,
                },
                error: null,
            })

            mockSupabase.update.mockResolvedValueOnce({ error: null })

            await incrementUsage(mockSupabase as any, 'user-123')

            expect(mockSupabase.update).toHaveBeenCalled()
        })

        it('should throw error if user not found', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null,
            })

            await expect(
                incrementUsage(mockSupabase as any, 'nonexistent')
            ).rejects.toThrow()
        })

        it('should throw error if update fails', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    message_count: 10,
                    daily_message_count: 5,
                },
                error: null,
            })

            mockSupabase.update.mockResolvedValueOnce({
                error: { message: 'Update failed' },
            })

            await expect(
                incrementUsage(mockSupabase as any, 'user-123')
            ).rejects.toThrow('Failed to update usage data')
        })
    })

    describe('checkProUsage', () => {
        it('should return pro usage data under limit', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    daily_pro_message_count: 100,
                    daily_pro_reset: new Date().toISOString(),
                },
                error: null,
            })

            const result = await checkProUsage(mockSupabase as any, 'user-123')

            expect(result).toHaveProperty('dailyProCount')
            expect(result).toHaveProperty('limit')
            expect(result.dailyProCount).toBe(100)
            expect(result.limit).toBe(500)
        })

        it('should throw error when pro limit reached', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    daily_pro_message_count: 500,
                    daily_pro_reset: new Date().toISOString(),
                },
                error: null,
            })

            await expect(
                checkProUsage(mockSupabase as any, 'user-123')
            ).rejects.toThrow(UsageLimitError)
        })

        it('should reset pro count when new day', async () => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)

            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    daily_pro_message_count: 400,
                    daily_pro_reset: yesterday.toISOString(),
                },
                error: null,
            })

            mockSupabase.update.mockResolvedValueOnce({ error: null })

            const result = await checkProUsage(mockSupabase as any, 'user-123')

            expect(result.dailyProCount).toBe(0)
            expect(mockSupabase.update).toHaveBeenCalled()
        })

        it('should throw error if user not found', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null,
            })

            await expect(
                checkProUsage(mockSupabase as any, 'nonexistent')
            ).rejects.toThrow('User not found')
        })
    })

    describe('incrementProUsage', () => {
        it('should increment pro message count', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    daily_pro_message_count: 50,
                },
                error: null,
            })

            mockSupabase.update.mockResolvedValueOnce({ error: null })

            await incrementProUsage(mockSupabase as any, 'user-123')

            expect(mockSupabase.update).toHaveBeenCalled()
        })

        it('should throw error if user not found', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null,
            })

            await expect(
                incrementProUsage(mockSupabase as any, 'nonexistent')
            ).rejects.toThrow()
        })

        it('should throw error if update fails', async () => {
            mockSupabase.maybeSingle.mockResolvedValueOnce({
                data: {
                    daily_pro_message_count: 50,
                },
                error: null,
            })

            mockSupabase.update.mockResolvedValueOnce({
                error: { message: 'Update failed' },
            })

            await expect(
                incrementProUsage(mockSupabase as any, 'user-123')
            ).rejects.toThrow('Failed to increment pro usage')
        })
    })
})
