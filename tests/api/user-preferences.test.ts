/**
 * Tests for /api/user-preferences endpoint
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

import { GET, PUT } from '@/app/api/user-preferences/route'

// Mock request helper
const mockRequest = (body: object) => ({ json: async () => body } as Request)

describe('User Preferences API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/user-preferences', () => {
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

    it('should return default preferences when none exist', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.layout).toBe('fullscreen')
      expect(data.prompt_suggestions).toBe(true)
      expect(data.show_tool_invocations).toBe(true)
      expect(data.show_conversation_previews).toBe(true)
      expect(data.multi_model_enabled).toBe(false)
      expect(data.hidden_models).toEqual([])
    })

    it('should return user preferences when they exist', async () => {
      const mockPreferences = {
        layout: 'split',
        prompt_suggestions: false,
        show_tool_invocations: false,
        show_conversation_previews: true,
        multi_model_enabled: true,
        hidden_models: ['model-1'],
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPreferences,
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
      expect(data.layout).toBe('split')
      expect(data.prompt_suggestions).toBe(false)
      expect(data.multi_model_enabled).toBe(true)
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
                error: { code: 'OTHER_ERROR', message: 'Query failed' },
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch user preferences')
    })
  })

  describe('PUT /api/user-preferences', () => {
    it('should return 500 when Supabase is not available', async () => {
      mockCreateClient.mockResolvedValue(null)

      const request = mockRequest({ layout: 'split' })

      const response = await PUT(request)
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

      const request = mockRequest({ layout: 'split' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 if layout is not a string', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ layout: 123 })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('layout must be a string')
    })

    it('should return 400 if hidden_models is not an array', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ hidden_models: 'not-an-array' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('hidden_models must be an array')
    })

    it('should update preferences successfully', async () => {
      const updatedPreferences = {
        layout: 'split',
        prompt_suggestions: false,
        show_tool_invocations: true,
        show_conversation_previews: true,
        multi_model_enabled: true,
        hidden_models: ['model-1'],
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: updatedPreferences,
                error: null,
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ layout: 'split', multi_model_enabled: true })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.layout).toBe('split')
      expect(data.multi_model_enabled).toBe(true)
    })

    it('should return 500 on upsert error', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null }),
        },
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Upsert failed' },
              }),
            }),
          }),
        }),
      }

      mockCreateClient.mockResolvedValue(mockSupabase)

      const request = mockRequest({ layout: 'split' })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update user preferences')
    })
  })
})
