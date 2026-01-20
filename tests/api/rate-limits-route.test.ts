/**
 * Tests for /api/rate-limits endpoint
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

// Mock the getMessageUsage function - must be before imports
const mockGetMessageUsage = jest.fn()

jest.mock('@/app/api/rate-limits/api', () => ({
  getMessageUsage: (...args: unknown[]) => mockGetMessageUsage(...args),
}))

import { GET } from '@/app/api/rate-limits/route'

// Helper to create mock Request with URL
function createMockRequest(url: string) {
  return {
    url,
  } as unknown as Request
}

describe('Rate Limits API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/rate-limits', () => {
    it('should return 400 if userId is missing', async () => {
      const request = createMockRequest('http://localhost:3000/api/rate-limits?isAuthenticated=true')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing userId')
    })

    it('should return usage data for authenticated user', async () => {
      const mockUsage = {
        dailyCount: 10,
        dailyProCount: 5,
        dailyLimit: 1000,
        remaining: 990,
        remainingPro: 95,
      }

      mockGetMessageUsage.mockResolvedValue(mockUsage)

      const request = createMockRequest('http://localhost:3000/api/rate-limits?userId=user-123&isAuthenticated=true')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockUsage)
      expect(mockGetMessageUsage).toHaveBeenCalledWith('user-123', true)
    })

    it('should return usage data for non-authenticated user', async () => {
      const mockUsage = {
        dailyCount: 3,
        dailyProCount: 0,
        dailyLimit: 5,
        remaining: 2,
        remainingPro: 100,
      }

      mockGetMessageUsage.mockResolvedValue(mockUsage)

      const request = createMockRequest('http://localhost:3000/api/rate-limits?userId=guest-123&isAuthenticated=false')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockUsage)
      expect(mockGetMessageUsage).toHaveBeenCalledWith('guest-123', false)
    })

    it('should return 200 with error message when Supabase is not available', async () => {
      mockGetMessageUsage.mockResolvedValue(null)

      const request = createMockRequest('http://localhost:3000/api/rate-limits?userId=user-123&isAuthenticated=true')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.error).toBe('Supabase not available in this deployment.')
    })

    it('should return 500 on internal error', async () => {
      mockGetMessageUsage.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest('http://localhost:3000/api/rate-limits?userId=user-123&isAuthenticated=true')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })
})
