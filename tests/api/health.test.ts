/**
 * Tests for /api/health endpoint
 */

// Mock NextResponse before importing the route
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({
      status: init?.status || 200,
      json: async () => body,
    })),
  },
}))

import { GET } from '@/app/api/health/route'

describe('Health API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('should return status ok with 200', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('ok')
      expect(data.timestamp).toBeDefined()
      expect(data.uptime).toBeDefined()
      expect(typeof data.uptime).toBe('number')
    })

    it('should return a valid ISO timestamp', async () => {
      const response = await GET()
      const data = await response.json()

      const timestamp = new Date(data.timestamp)
      expect(timestamp.toISOString()).toBe(data.timestamp)
    })
  })
})
