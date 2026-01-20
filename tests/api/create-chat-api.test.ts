/**
 * Tests for /app/api/create-chat/api.ts (createChatInDb function)
 */

// Mock dependencies - must be before imports
const mockValidateUserIdentity = jest.fn()
const mockCheckUsageByModel = jest.fn()
const mockCryptoRandomUUID = jest.fn()

jest.mock('@/lib/server/api', () => ({
  validateUserIdentity: (...args: unknown[]) => mockValidateUserIdentity(...args),
}))

jest.mock('@/lib/usage', () => ({
  checkUsageByModel: (...args: unknown[]) => mockCheckUsageByModel(...args),
}))

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => mockCryptoRandomUUID(),
  },
})

import { createChatInDb } from '@/app/api/create-chat/api'

describe('Create Chat API - createChatInDb', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCryptoRandomUUID.mockReturnValue('mock-uuid-123')
  })

  describe('When Supabase is not available', () => {
    it('should return a local chat object with generated UUID', async () => {
      mockValidateUserIdentity.mockResolvedValue(null)

      const result = await createChatInDb({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: false,
      })

      expect(result).toEqual({
        id: 'mock-uuid-123',
        user_id: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
      expect(mockValidateUserIdentity).toHaveBeenCalledWith('user-123', false)
      expect(mockCheckUsageByModel).not.toHaveBeenCalled()
    })

    it('should return local chat without title when not provided', async () => {
      mockValidateUserIdentity.mockResolvedValue(null)

      const result = await createChatInDb({
        userId: 'user-456',
        model: 'claude-3',
        isAuthenticated: true,
      })

      expect(result).toEqual({
        id: 'mock-uuid-123',
        user_id: 'user-456',
        title: undefined,
        model: 'claude-3',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })
  })

  describe('When Supabase is available', () => {
    it('should create chat in database and return data', async () => {
      const mockChatData = {
        id: 'db-chat-id',
        user_id: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockChatData, error: null }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)
      mockCheckUsageByModel.mockResolvedValue(undefined)

      const result = await createChatInDb({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
      })

      expect(result).toEqual(mockChatData)
      expect(mockValidateUserIdentity).toHaveBeenCalledWith('user-123', true)
      expect(mockCheckUsageByModel).toHaveBeenCalledWith(
        mockSupabase,
        'user-123',
        'gpt-4',
        true
      )
      expect(mockSupabase.from).toHaveBeenCalledWith('chats')
    })

    it('should use "New Chat" as default title when not provided', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'chat-id', title: 'New Chat' },
                error: null,
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)
      mockCheckUsageByModel.mockResolvedValue(undefined)

      await createChatInDb({
        userId: 'user-123',
        model: 'gpt-4',
        isAuthenticated: true,
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('chats')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'New Chat',
        model: 'gpt-4',
      })
    })

    it('should include projectId when provided', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'chat-id', project_id: 'project-123' },
                error: null,
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)
      mockCheckUsageByModel.mockResolvedValue(undefined)

      await createChatInDb({
        userId: 'user-123',
        title: 'Project Chat',
        model: 'gpt-4',
        isAuthenticated: true,
        projectId: 'project-123',
      })

      expect(mockSupabase.from().insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        title: 'Project Chat',
        model: 'gpt-4',
        project_id: 'project-123',
      })
    })

    it('should return null when database insert fails', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed' },
              }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)
      mockCheckUsageByModel.mockResolvedValue(undefined)

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await createChatInDb({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
      })

      expect(result).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('Error creating chat:', { message: 'Insert failed' })

      consoleSpy.mockRestore()
    })

    it('should return null when data is missing from response', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      }

      mockValidateUserIdentity.mockResolvedValue(mockSupabase)
      mockCheckUsageByModel.mockResolvedValue(undefined)

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const result = await createChatInDb({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
      })

      expect(result).toBeNull()

      consoleSpy.mockRestore()
    })
  })
})
