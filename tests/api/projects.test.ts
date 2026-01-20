/**
 * Tests for /api/projects endpoint
 */

// Mock supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
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

import { POST, GET } from '@/app/api/projects/route'
import { createClient } from '@/lib/supabase/server'

// Helper to create mock Request
function createMockRequest(body: object) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request
}

describe('Projects API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/projects', () => {
    it('should return 200 with message when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({ name: 'Test Project' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.error).toBe('Supabase not available in this deployment.')
    })

    it('should return 400 when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ name: 'Test Project' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing userId')
    })

    it('should create project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        user_id: 'user-123',
        created_at: new Date().toISOString(),
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ name: 'Test Project' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProject)
    })

    it('should return 500 when database insert fails', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ name: 'Test Project' })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Insert failed')
    })
  })

  describe('GET /api/projects', () => {
    it('should return 200 with message when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.error).toBe('Supabase not available in this deployment.')
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

    it('should return projects for authenticated user', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'Project 1', user_id: 'user-123' },
        { id: 'project-2', name: 'Project 2', user_id: 'user-123' },
      ]

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockProjects, error: null }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProjects)
    })

    it('should return 500 when database query fails', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Query failed' } }),
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
  })
})
