/**
 * Integration Tests: Chat API Route
 */

import { POST } from '@/app/api/chat/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/models', () => ({
    getAllModels: jest.fn().mockResolvedValue([
        {
            id: 'gpt-4.1-nano',
            name: 'GPT-4.1 Nano',
            provider: 'openai',
            apiSdk: jest.fn().mockReturnValue({}),
        },
    ]),
}))

jest.mock('@/lib/openproviders/provider-map', () => ({
    getProviderForModel: jest.fn().mockReturnValue('openai'),
}))

jest.mock('./api', () => ({
    incrementMessageCount: jest.fn().mockResolvedValue({}),
    logUserMessage: jest.fn().mockResolvedValue({}),
    storeAssistantMessage: jest.fn().mockResolvedValue({}),
    validateAndTrackUsage: jest.fn().mockResolvedValue(null),
}))

jest.mock('ai', () => ({
    streamText: jest.fn().mockReturnValue({
        toDataStreamResponse: jest.fn().mockReturnValue(
            new Response('data: {"type":"text-delta","text":"Hello"}\n\n', {
                headers: { 'Content-Type': 'text/event-stream' },
            })
        ),
    }),
}))

describe('Chat API Route', () => {
    describe('POST /api/chat', () => {
        it('should return 400 if messages are missing', async () => {
            const request = new NextRequest('http://localhost:3000/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    chatId: 'test-chat-id',
                    userId: 'test-user-id',
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBeDefined()
        })

        it('should return 400 if chatId is missing', async () => {
            const request = new NextRequest('http://localhost:3000/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Hello' }],
                    userId: 'test-user-id',
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBeDefined()
        })

        it('should return 400 if userId is missing', async () => {
            const request = new NextRequest('http://localhost:3000/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Hello' }],
                    chatId: 'test-chat-id',
                }),
            })

            const response = await POST(request)
            const data = await response.json()

            expect(response.status).toBe(400)
            expect(data.error).toBeDefined()
        })

        it('should accept valid chat request', async () => {
            const request = new NextRequest('http://localhost:3000/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Hello' }],
                    chatId: 'test-chat-id',
                    userId: 'test-user-id',
                    model: 'gpt-4.1-nano',
                    isAuthenticated: true,
                    systemPrompt: 'You are helpful',
                    enableSearch: false,
                }),
            })

            const response = await POST(request)

            // Should return a streaming response
            expect(response.headers.get('Content-Type')).toContain('text')
        })

        it('should handle model not found error', async () => {
            const { getAllModels } = require('@/lib/models')
            getAllModels.mockResolvedValueOnce([])

            const request = new NextRequest('http://localhost:3000/api/chat', {
                method: 'POST',
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Hello' }],
                    chatId: 'test-chat-id',
                    userId: 'test-user-id',
                    model: 'unknown-model',
                    isAuthenticated: true,
                }),
            })

            const response = await POST(request)

            // Should return an error response
            expect(response.status).toBeGreaterThanOrEqual(400)
        })
    })
})
