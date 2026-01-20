/**
 * Tests for /api/models endpoint
 */

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/models', () => ({
  getAllModels: jest.fn(),
  getModelsWithAccessFlags: jest.fn(),
  getModelsForUserProviders: jest.fn(),
  refreshModelsCache: jest.fn(),
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

import { GET, POST } from '@/app/api/models/route'
import { createClient } from '@/lib/supabase/server'
import { getAllModels, getModelsWithAccessFlags, getModelsForUserProviders, refreshModelsCache } from '@/lib/models'

describe('Models API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/models', () => {
    it('should return all models with accessible flag when Supabase is not available', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
        { id: 'claude-3', name: 'Claude 3', provider: 'anthropic' },
      ]

      ;(createClient as jest.Mock).mockResolvedValue(null)
      ;(getAllModels as jest.Mock).mockResolvedValue(mockModels)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.models).toHaveLength(2)
      expect(data.models[0].accessible).toBe(true)
      expect(data.models[1].accessible).toBe(true)
    })

    it('should return models with access flags for unauthenticated users', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai', accessible: false },
      ]

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(getModelsWithAccessFlags as jest.Mock).mockResolvedValue(mockModels)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(getModelsWithAccessFlags).toHaveBeenCalled()
    })

    it('should return models with access flags when user has no API keys', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai', accessible: false },
      ]

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(getModelsWithAccessFlags as jest.Mock).mockResolvedValue(mockModels)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(getModelsWithAccessFlags).toHaveBeenCalled()
    })

    it('should return user-specific models when user has API keys', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai', accessible: true },
      ]

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: [{ provider: 'openai' }], error: null }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(getModelsForUserProviders as jest.Mock).mockResolvedValue(mockModels)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(getModelsForUserProviders).toHaveBeenCalledWith(['openai'])
    })

    it('should return 500 on error', async () => {
      ;(createClient as jest.Mock).mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch models')
    })

    it('should return models with access flags when fetching user keys fails', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai', accessible: false },
      ]

      const mockSupabase = {
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } }),
        },
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Error' } }),
          }),
        }),
      }

      ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
      ;(getModelsWithAccessFlags as jest.Mock).mockResolvedValue(mockModels)

      const response = await GET()

      expect(response.status).toBe(200)
      expect(getModelsWithAccessFlags).toHaveBeenCalled()
    })
  })

  describe('POST /api/models', () => {
    it('should refresh models cache and return updated models', async () => {
      const mockModels = [
        { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
      ]

      ;(refreshModelsCache as jest.Mock).mockReturnValue(undefined)
      ;(getAllModels as jest.Mock).mockResolvedValue(mockModels)

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Models cache refreshed')
      expect(data.models).toEqual(mockModels)
      expect(data.count).toBe(1)
      expect(data.timestamp).toBeDefined()
      expect(refreshModelsCache).toHaveBeenCalled()
    })

    it('should return 500 on refresh failure', async () => {
      ;(refreshModelsCache as jest.Mock).mockImplementation(() => {
        throw new Error('Refresh failed')
      })

      const response = await POST()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to refresh models')
    })
  })
})
