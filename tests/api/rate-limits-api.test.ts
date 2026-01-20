/**
 * Tests for /app/api/rate-limits/api.ts (getMessageUsage function)
 */

// Mock dependencies - must be before imports
const mockValidateUserIdentity = jest.fn()

jest.mock('@/lib/server/api', () => ({
  validateUserIdentity: (...args: unknown[]) => mockValidateUserIdentity(...args),
}))

jest.mock('@/lib/config', () => ({
  AUTH_DAILY_MESSAGE_LIMIT: 1000,
  NON_AUTH_DAILY_MESSAGE_LIMIT: 10,
  DAILY_LIMIT_PRO_MODELS: 100,
}))

import { getMessageUsage } from '@/app/api/rate-limits/api'

describe('Rate Limits API - getMessageUsage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('When Supabase is not available', () => {
    it('should return null for authenticated user', async () => {
      mockValidateUserIdentity.mockResolvedValue(null)

      const result = await getMessageUsage('user-123', true)

      expect(result).toBeNull()
      expect(mockValidateUserIdentity).toHaveBeenCalledWith('user-123', true)
    })

    it('should return null for non-authenticated user', async () => {
      mockValidateUserIdentity.mockResolvedValue(null)

      const result = await getMessageUsage('guest-456', false)

      expect(result).toBeNull()
      expect(mockValidateUserIdentity).toHaveBeenCalledWith('guest-456', false)
    })
  })

  describe('When Supabase is available', () => {
    it('should return usage data for authenticated user', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  daily_message_count: 50,
                  daily_pro_message_count: 10,
                },
                error: null,
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)

      const result = await getMessageUsage('user-123', true)

      expect(result).toEqual({
        dailyCount: 50,
        dailyProCount: 10,
        dailyLimit: 1000, // AUTH_DAILY_MESSAGE_LIMIT
        remaining: 950, // 1000 - 50
        remainingPro: 90, // 100 - 10
      })
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should return usage data for non-authenticated user with lower limit', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  daily_message_count: 5,
                  daily_pro_message_count: 0,
                },
                error: null,
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)

      const result = await getMessageUsage('guest-456', false)

      expect(result).toEqual({
        dailyCount: 5,
        dailyProCount: 0,
        dailyLimit: 10, // NON_AUTH_DAILY_MESSAGE_LIMIT
        remaining: 5, // 10 - 5
        remainingPro: 100, // 100 - 0
      })
    })

    it('should handle zero usage counts', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  daily_message_count: 0,
                  daily_pro_message_count: 0,
                },
                error: null,
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)

      const result = await getMessageUsage('user-123', true)

      expect(result).toEqual({
        dailyCount: 0,
        dailyProCount: 0,
        dailyLimit: 1000,
        remaining: 1000,
        remainingPro: 100,
      })
    })

    it('should handle null counts as zero', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: {
                  daily_message_count: null,
                  daily_pro_message_count: null,
                },
                error: null,
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)

      const result = await getMessageUsage('user-123', true)

      expect(result).toEqual({
        dailyCount: 0,
        dailyProCount: 0,
        dailyLimit: 1000,
        remaining: 1000,
        remainingPro: 100,
      })
    })

    it('should throw error when database query fails', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)

      await expect(getMessageUsage('user-123', true)).rejects.toThrow(
        'Database connection failed'
      )
    })

    it('should throw error when data is null without error', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)

      await expect(getMessageUsage('user-123', true)).rejects.toThrow(
        'Failed to fetch message usage'
      )
    })

    it('should query the correct user by ID', async () => {
      const mockEq = jest.fn().mockReturnValue({
        maybeSingle: jest.fn().mockResolvedValue({
          data: { daily_message_count: 0, daily_pro_message_count: 0 },
          error: null,
        }),
      })

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: mockEq,
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)

      await getMessageUsage('specific-user-id', true)

      expect(mockEq).toHaveBeenCalledWith('id', 'specific-user-id')
    })
  })
})
