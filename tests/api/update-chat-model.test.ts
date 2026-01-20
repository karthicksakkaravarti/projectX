/**
 * Tests for /api/update-chat-model endpoint
 */

// Mock supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { POST } from '@/app/api/update-chat-model/route'
import { createClient } from '@/lib/supabase/server'

// Helper to create mock Request
function createMockRequest(body: object) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request
}

describe('Update Chat Model API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/update-chat-model', () => {
    it('should return 400 if chatId is missing', async () => {
      const request = createMockRequest({ model: 'gpt-4' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing chatId or model')
    })

    it('should return 400 if model is missing', async () => {
      const request = createMockRequest({ chatId: 'chat-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing chatId or model')
    })

    it('should return success when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({ chatId: 'chat-123', model: 'gpt-4' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should update chat model successfully', async () => {
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ chatId: 'chat-123', model: 'gpt-4' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('chats')
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

      const request = createMockRequest({ chatId: 'chat-123', model: 'gpt-4' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update chat model')
      expect(data.details).toBe('Update failed')
    })

    it('should return 500 on internal error', async () => {
      ;(createClient as jest.Mock).mockRejectedValue(new Error('Connection error'))

      const request = createMockRequest({ chatId: 'chat-123', model: 'gpt-4' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Connection error')
    })
  })
})
