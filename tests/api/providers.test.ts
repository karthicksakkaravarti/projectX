/**
 * Tests for /api/providers endpoint
 */

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/user-keys', () => ({
  getEffectiveApiKey: jest.fn(),
}))

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}))

import { POST } from '@/app/api/providers/route'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveApiKey } from '@/lib/user-keys'

// Helper to create mock Request
function createMockRequest(body: object) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as any
}

describe('Providers API', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('POST /api/providers', () => {
    it('should return 500 when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({ provider: 'openai', userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database not available')
    })

    it('should return 401 when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ provider: 'openai', userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 401 when user id does not match', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'different-user' } } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ provider: 'openai', userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return hasUserKey: false for ollama provider', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ provider: 'ollama', userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasUserKey).toBe(false)
      expect(data.provider).toBe('ollama')
    })

    it('should return hasUserKey: true when user has custom API key', async () => {
      process.env.OPENAI_API_KEY = 'env-api-key'

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(getEffectiveApiKey as jest.Mock).mockResolvedValue('user-custom-key')

      const request = createMockRequest({ provider: 'openai', userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasUserKey).toBe(true)
      expect(data.provider).toBe('openai')
    })

    it('should return hasUserKey: false when user key matches env key', async () => {
      process.env.OPENAI_API_KEY = 'same-api-key'

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(getEffectiveApiKey as jest.Mock).mockResolvedValue('same-api-key')

      const request = createMockRequest({ provider: 'openai', userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasUserKey).toBe(false)
      expect(data.provider).toBe('openai')
    })

    it('should return hasUserKey: false when no API key exists', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(getEffectiveApiKey as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({ provider: 'anthropic', userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.hasUserKey).toBe(false)
    })

    it('should return 500 on internal error', async () => {
      ;(createClient as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = createMockRequest({ provider: 'openai', userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
