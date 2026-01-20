/**
 * Tests for /api/toggle-chat-pin endpoint
 */

// Mock supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}))

import { POST } from '@/app/api/toggle-chat-pin/route'
import { createClient } from '@/lib/supabase/server'

// Helper to create mock Request
function createMockRequest(body: object) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request
}

describe('Toggle Chat Pin API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/toggle-chat-pin', () => {
    it('should return 400 if chatId is missing', async () => {
      const request = createMockRequest({ pinned: true })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing chatId or pinned')
    })

    it('should return 400 if pinned is not a boolean', async () => {
      const request = createMockRequest({ chatId: 'chat-123', pinned: 'true' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing chatId or pinned')
    })

    it('should return success when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({ chatId: 'chat-123', pinned: true })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should pin a chat successfully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ chatId: 'chat-123', pinned: true })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('chats')
    })

    it('should unpin a chat successfully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ chatId: 'chat-123', pinned: false })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 500 on database error', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ chatId: 'chat-123', pinned: true })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update pinned')
    })

    it('should return 500 on internal error', async () => {
      ;(createClient as jest.Mock).mockRejectedValue(new Error('Connection error'))

      const request = createMockRequest({ chatId: 'chat-123', pinned: true })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
