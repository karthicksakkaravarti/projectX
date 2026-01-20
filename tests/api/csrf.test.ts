/**
 * Tests for /api/csrf endpoint
 */

// Mock the CSRF library
jest.mock('@/lib/csrf', () => ({
  generateCsrfToken: jest.fn().mockReturnValue('mock-csrf-token'),
}))

// Create mock function before using it
const mockCookieSet = jest.fn()

// Mock next/headers cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    set: jest.fn(),
  }),
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

import { GET } from '@/app/api/csrf/route'
import { cookies } from 'next/headers'

describe('CSRF API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Re-setup the mock for each test
    ;(cookies as jest.Mock).mockResolvedValue({
      set: mockCookieSet,
    })
  })

  describe('GET /api/csrf', () => {
    it('should return ok and set csrf cookie', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(mockCookieSet).toHaveBeenCalledWith('csrf_token', 'mock-csrf-token', {
        httpOnly: false,
        secure: true,
        path: '/',
      })
    })
  })
})
