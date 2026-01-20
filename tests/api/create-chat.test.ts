/**
 * Tests for /api/create-chat endpoint
 */

// Mock the createChatInDb function
jest.mock('@/app/api/create-chat/api', () => ({
  createChatInDb: jest.fn(),
}))

import { POST } from '@/app/api/create-chat/route'
import { createChatInDb } from '@/app/api/create-chat/api'

// Helper to create mock Request
function createMockRequest(body: object) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request
}

describe('Create Chat API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/create-chat', () => {
    it('should return 400 if userId is missing', async () => {
      const request = createMockRequest({ title: 'Test Chat', model: 'gpt-4' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing userId')
    })

    it('should return 200 with chat data on successful creation', async () => {
      const mockChat = {
        id: 'chat-123',
        user_id: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      ;(createChatInDb as jest.Mock).mockResolvedValue(mockChat)

      const request = createMockRequest({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.chat).toEqual(mockChat)
      expect(createChatInDb).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
        projectId: undefined,
      })
    })

    it('should return 200 with error message when Supabase is not available', async () => {
      ;(createChatInDb as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.error).toBe('Supabase not available in this deployment.')
    })

    it('should return 403 when daily limit is reached', async () => {
      ;(createChatInDb as jest.Mock).mockRejectedValue(new Error('DAILY_LIMIT_REACHED'))

      const request = createMockRequest({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('DAILY_LIMIT_REACHED')
      expect(data.code).toBe('DAILY_LIMIT_REACHED')
    })

    it('should return 500 on internal error', async () => {
      ;(createChatInDb as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })

    it('should pass projectId when provided', async () => {
      const mockChat = {
        id: 'chat-123',
        user_id: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        project_id: 'project-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      ;(createChatInDb as jest.Mock).mockResolvedValue(mockChat)

      const request = createMockRequest({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
        projectId: 'project-123',
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createChatInDb).toHaveBeenCalledWith({
        userId: 'user-123',
        title: 'Test Chat',
        model: 'gpt-4',
        isAuthenticated: true,
        projectId: 'project-123',
      })
    })
  })
})
