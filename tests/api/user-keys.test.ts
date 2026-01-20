/**
 * Tests for /api/user-keys endpoint
 */

// Mock dependencies - must be before imports
const mockCreateClient = jest.fn()
const mockGetModelsForProvider = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

jest.mock('@/lib/encryption', () => ({
  encryptKey: jest.fn().mockReturnValue({ encrypted: 'encrypted-key', iv: 'iv-string' }),
}))

jest.mock('@/lib/models', () => ({
  getModelsForProvider: (...args: unknown[]) => mockGetModelsForProvider(...args),
}))

jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => ({
      json: async () => data,
      status: init?.status || 200,
    }),
  },
}))

import { POST, DELETE } from '@/app/api/user-keys/route'

// Mock request helper
const mockRequest = (body: object) => ({ json: async () => body } as Request)

describe('User Keys API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/user-keys', () => {
    it('should return 400 if provider is missing', async () => {
      const request = mockRequest({ apiKey: 'test-key' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Provider and API key are required')
    })

    it('should return 400 if apiKey is missing', async () => {
      const request = mockRequest({ provider: 'openai' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Provider and API key are required')
    })

    it('should return 500 when Supabase is not available', async () => {
      mockCreateClient.mockResolvedValue(null)

      const request = mockRequest({ provider: 'openai', apiKey: 'test-key' })

      const response = await POST(request)
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

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ provider: 'openai', apiKey: 'test-key' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should save new API key and add models to favorites', async () => {
      const mockModels = [{ id: 'gpt-4' }, { id: 'gpt-3.5-turbo' }]

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === 'user_keys') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null }),
                  }),
                }),
              }),
              upsert: jest.fn().mockResolvedValue({ error: null }),
            }
          }
          if (table === 'users') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: { favorite_models: [] } }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            }
          }
          return {}
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)
      mockGetModelsForProvider.mockResolvedValue(mockModels)

      const request = mockRequest({ provider: 'openai', apiKey: 'test-key' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.isNewKey).toBe(true)
    })

    it('should update existing API key', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === 'user_keys') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: { provider: 'openai' } }),
                  }),
                }),
              }),
              upsert: jest.fn().mockResolvedValue({ error: null }),
            }
          }
          return {}
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ provider: 'openai', apiKey: 'updated-key' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.isNewKey).toBe(false)
      expect(data.message).toBe('API key updated')
    })

    it('should return 500 on upsert error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockImplementation((table) => {
          if (table === 'user_keys') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null }),
                  }),
                }),
              }),
              upsert: jest.fn().mockResolvedValue({ error: { message: 'Upsert failed' } }),
            }
          }
          return {}
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ provider: 'openai', apiKey: 'test-key' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Upsert failed')
    })
  })

  describe('DELETE /api/user-keys', () => {
    it('should return 400 if provider is missing', async () => {
      const request = mockRequest({})

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Provider is required')
    })

    it('should return 500 when Supabase is not available', async () => {
      mockCreateClient.mockResolvedValue(null)

      const request = mockRequest({ provider: 'openai' })

      const response = await DELETE(request)
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

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ provider: 'openai' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should delete API key successfully', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ provider: 'openai' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 500 on delete error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ provider: 'openai' })

      const response = await DELETE(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Delete failed')
    })
  })
})
