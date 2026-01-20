/**
 * Tests for /api/user-preferences/favorite-models endpoint
 */

// Mock supabase - must be before imports
const mockCreateClient = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

import { GET, POST } from '@/app/api/user-preferences/favorite-models/route'

// Mock request helper
const mockRequest = (body: object) => ({ json: async () => body } as Request)

describe('Favorite Models API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/user-preferences/favorite-models', () => {
    it('should return 500 when Supabase is not available', async () => {
      mockCreateClient.mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
    })

    it('should return 401 when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return favorite models for authenticated user', async () => {
      const mockFavorites = ['gpt-4', 'claude-3', 'gemini-pro']

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { favorite_models: mockFavorites },
                error: null,
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.favorite_models).toEqual(mockFavorites)
    })

    it('should return empty array when no favorites exist', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { favorite_models: null },
                error: null,
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.favorite_models).toEqual([])
    })

    it('should return 500 on database error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Query failed' },
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch favorite models')
    })
  })

  describe('POST /api/user-preferences/favorite-models', () => {
    it('should return 500 when Supabase is not available', async () => {
      mockCreateClient.mockResolvedValue(null)

      const request = mockRequest({ favorite_models: ['gpt-4'] })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
    })

    it('should return 401 when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ favorite_models: ['gpt-4'] })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if favorite_models is not an array', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ favorite_models: 'not-an-array' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('favorite_models must be an array')
    })

    it('should return 400 if favorite_models contains non-strings', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ favorite_models: ['gpt-4', 123, 'claude'] })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('All favorite_models must be strings')
    })

    it('should update favorite models successfully', async () => {
      const newFavorites = ['gpt-4', 'claude-3']

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { favorite_models: newFavorites },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ favorite_models: newFavorites })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.favorite_models).toEqual(newFavorites)
    })

    it('should return 500 on update error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Update failed' },
                }),
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ favorite_models: ['gpt-4'] })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update favorite models')
    })
  })
})
