/**
 * Tests for /api/user-key-status endpoint
 */

// Mock supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock providers
jest.mock('@/lib/providers', () => ({
  PROVIDERS: [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic' },
    { id: 'google', name: 'Google' },
  ],
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

import { GET } from '@/app/api/user-key-status/route'
import { createClient } from '@/lib/supabase/server'

describe('User Key Status API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/user-key-status', () => {
    it('should return 500 when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Supabase not available')
    })

    it('should return 401 when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return provider status for authenticated user', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [{ provider: 'openai' }, { provider: 'anthropic' }],
              error: null,
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.openai).toBe(true)
      expect(data.anthropic).toBe(true)
      expect(data.google).toBe(false)
    })

    it('should return all false when user has no keys', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.openai).toBe(false)
      expect(data.anthropic).toBe(false)
      expect(data.google).toBe(false)
    })

    it('should return 500 on database error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Query failed' },
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Query failed')
    })

    it('should return 500 on internal error', async () => {
      ;(createClient as jest.Mock).mockRejectedValue(new Error('Connection error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
