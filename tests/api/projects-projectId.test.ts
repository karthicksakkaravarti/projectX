/**
 * Tests for /api/projects/[projectId] endpoint
 */

// Mock supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
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

import { GET, PUT, DELETE } from '@/app/api/projects/[projectId]/route'
import { createClient } from '@/lib/supabase/server'

// Helper to create mock Request with URL
function createMockRequest(body?: object) {
  return {
    json: body ? jest.fn().mockResolvedValue(body) : jest.fn(),
  } as unknown as any
}

describe('Projects [projectId] API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createMockParams = (projectId: string) => Promise.resolve({ projectId })

  describe('GET /api/projects/[projectId]', () => {
    it('should return 200 with message when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest()
      const response = await GET(request, { params: createMockParams('project-123') })
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

      const request = createMockRequest()
      const response = await GET(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return project when found', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        user_id: 'user-123',
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
              }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest()
      const response = await GET(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProject)
    })

    it('should return 404 when project not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest()
      const response = await GET(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Project not found')
    })
  })

  describe('PUT /api/projects/[projectId]', () => {
    it('should return 200 with message when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({ name: 'Updated Project' })
      const response = await PUT(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.error).toBe('Supabase not available in this deployment.')
    })

    it('should return 400 when name is empty', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ name: '   ' })
      const response = await PUT(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Project name is required')
    })

    it('should return 401 when user is not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ name: 'Updated Project' })
      const response = await PUT(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should update project successfully', async () => {
      const mockProject = {
        id: 'project-123',
        name: 'Updated Project',
        user_id: 'user-123',
      }

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: mockProject, error: null }),
                }),
              }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ name: 'Updated Project' })
      const response = await PUT(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockProject)
    })

    it('should return 404 when project to update not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest({ name: 'Updated Project' })
      const response = await PUT(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Project not found')
    })
  })

  describe('DELETE /api/projects/[projectId]', () => {
    it('should return 200 with message when Supabase is not available', async () => {
      ;(createClient as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest()
      const response = await DELETE(request, { params: createMockParams('project-123') })
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

      const request = createMockRequest()
      const response = await DELETE(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should delete project successfully', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockImplementation(() => ({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: { id: 'project-123' }, error: null }),
              }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: null }),
            }),
          }),
        })),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest()
      const response = await DELETE(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    it('should return 404 when project to delete not found', async () => {
      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
              }),
            }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)

      const request = createMockRequest()
      const response = await DELETE(request, { params: createMockParams('project-123') })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Project not found')
    })
  })
})
