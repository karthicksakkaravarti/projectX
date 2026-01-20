/**
 * Tests for middleware.ts
 */

// Mock dependencies - must be before imports
const mockUpdateSession = jest.fn()
const mockValidateCsrfToken = jest.fn()

jest.mock('@/utils/supabase/middleware', () => ({
  updateSession: (...args: unknown[]) => mockUpdateSession(...args),
}))

jest.mock('@/lib/csrf', () => ({
  validateCsrfToken: (...args: unknown[]) => mockValidateCsrfToken(...args),
}))

// We need to import after mocks are set up
import { middleware, config } from '@/middleware'
import { NextRequest, NextResponse } from 'next/server'

// Helper to create mock NextRequest
function createMockRequest(
  url: string,
  options: {
    method?: string
    cookies?: Record<string, string>
    headers?: Record<string, string>
  } = {}
) {
  const { method = 'GET', cookies = {}, headers = {} } = options

  return {
    url,
    method,
    cookies: {
      get: (name: string) => (cookies[name] ? { value: cookies[name] } : undefined),
    },
    headers: {
      get: (name: string) => headers[name] || null,
    },
  } as unknown as NextRequest
}

describe('Middleware', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('GET requests (no CSRF check)', () => {
    it('should call updateSession and return response for GET requests', async () => {
      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      }
      mockUpdateSession.mockResolvedValue(mockResponse)

      const request = createMockRequest('http://localhost:3000/dashboard')

      const response = await middleware(request)

      expect(mockUpdateSession).toHaveBeenCalledWith(request)
      expect(response).toBe(mockResponse)
      expect(mockValidateCsrfToken).not.toHaveBeenCalled()
    })

    it('should set CSP headers for development', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      }
      mockUpdateSession.mockResolvedValue(mockResponse)

      const request = createMockRequest('http://localhost:3000/dashboard')

      await middleware(request)

      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      )
    })

    it('should set CSP headers for production', async () => {
      process.env.NODE_ENV = 'production'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'

      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      }
      mockUpdateSession.mockResolvedValue(mockResponse)

      const request = createMockRequest('http://localhost:3000/dashboard')

      await middleware(request)

      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining('vercel.live')
      )
    })
  })

  describe('POST/PUT/DELETE requests (CSRF check)', () => {
    it('should return 403 if csrf_token cookie is missing for POST request', async () => {
      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      }
      mockUpdateSession.mockResolvedValue(mockResponse)

      const request = createMockRequest('http://localhost:3000/api/data', {
        method: 'POST',
        headers: { 'x-csrf-token': 'valid-token' },
      })

      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
      // Response should have 403 status for missing CSRF cookie
    })

    it('should return 403 if x-csrf-token header is missing for PUT request', async () => {
      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      }
      mockUpdateSession.mockResolvedValue(mockResponse)

      const request = createMockRequest('http://localhost:3000/api/data', {
        method: 'PUT',
        cookies: { csrf_token: 'valid-token' },
      })

      const response = await middleware(request)

      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should return 403 if CSRF token validation fails for DELETE request', async () => {
      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      }
      mockUpdateSession.mockResolvedValue(mockResponse)
      mockValidateCsrfToken.mockReturnValue(false)

      const request = createMockRequest('http://localhost:3000/api/data', {
        method: 'DELETE',
        cookies: { csrf_token: 'invalid-token' },
        headers: { 'x-csrf-token': 'invalid-token' },
      })

      const response = await middleware(request)

      expect(mockValidateCsrfToken).toHaveBeenCalledWith('invalid-token')
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('should pass through when CSRF validation succeeds', async () => {
      const mockResponse = {
        headers: {
          set: jest.fn(),
        },
      }
      mockUpdateSession.mockResolvedValue(mockResponse)
      mockValidateCsrfToken.mockReturnValue(true)

      const request = createMockRequest('http://localhost:3000/api/data', {
        method: 'POST',
        cookies: { csrf_token: 'valid-token' },
        headers: { 'x-csrf-token': 'valid-token' },
      })

      const response = await middleware(request)

      expect(mockValidateCsrfToken).toHaveBeenCalledWith('valid-token')
      expect(response).toBe(mockResponse)
    })
  })

  describe('Config', () => {
    it('should have correct matcher configuration', () => {
      expect(config.matcher).toBeDefined()
      expect(config.matcher).toBeInstanceOf(Array)
      expect(config.runtime).toBe('nodejs')
    })

    it('should exclude static files from matcher', () => {
      const matcherPattern = config.matcher[0]
      expect(matcherPattern).toContain('_next/static')
      expect(matcherPattern).toContain('_next/image')
      expect(matcherPattern).toContain('favicon.ico')
    })
  })
})
