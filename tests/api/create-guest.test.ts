/**
 * Tests for /api/create-guest endpoint
 */

// Mock global Response since the route uses `new Response()` directly
class MockResponse {
  public status: number
  private body: string

  constructor(body: string, init?: ResponseInit) {
    this.body = body
    this.status = init?.status || 200
  }

  async json() {
    return JSON.parse(this.body)
  }
}

// @ts-expect-error - mocking global Response
global.Response = MockResponse

// Mock the supabase guest client - must be before imports
const mockCreateGuestServerClient = jest.fn()

jest.mock('@/lib/supabase/server-guest', () => ({
  createGuestServerClient: () => mockCreateGuestServerClient(),
}))

import { POST } from '@/app/api/create-guest/route'

// Helper to create mock Request
function createMockRequest(body: object) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request
}

describe('Create Guest API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/create-guest', () => {
    it('should return 400 if userId is missing', async () => {
      const request = createMockRequest({})

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing userId')
    })

    it('should return anonymous user when Supabase is not enabled', async () => {
      mockCreateGuestServerClient.mockResolvedValue(null)

      const request = createMockRequest({ userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual({ id: 'user-123', anonymous: true })
    })

    it('should return existing user if found', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'user-123@anonymous.example',
        anonymous: true,
        message_count: 5,
      }

      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: existingUser }),
            }),
          }),
        }),
      }

      mockCreateGuestServerClient.mockResolvedValue(mockSupabase)

      const request = createMockRequest({ userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual(existingUser)
    })

    it('should create new guest user if not found', async () => {
      const newUser = {
        id: 'user-123',
        email: 'user-123@anonymous.example',
        anonymous: true,
        message_count: 0,
        premium: false,
      }

      const mockSupabase = {
        from: jest.fn().mockImplementation((table) => {
          if (table === 'users') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null }),
                }),
              }),
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: newUser, error: null }),
                }),
              }),
            }
          }
          return {}
        }),
      }

      mockCreateGuestServerClient.mockResolvedValue(mockSupabase)

      const request = createMockRequest({ userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toEqual(newUser)
    })

    it('should return 500 when insert fails', async () => {
      const mockSupabase = {
        from: jest.fn().mockImplementation((table) => {
          if (table === 'users') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({ data: null }),
                }),
              }),
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
                }),
              }),
            }
          }
          return {}
        }),
      }

      mockCreateGuestServerClient.mockResolvedValue(mockSupabase)

      const request = createMockRequest({ userId: 'user-123' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create guest user')
    })
  })
})
