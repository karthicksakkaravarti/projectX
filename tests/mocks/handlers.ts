/**
 * MSW (Mock Service Worker) Handlers
 * Define API mocks for testing
 */

import { http, HttpResponse } from 'msw'

// Base URL for API routes
const API_BASE = 'http://localhost:3000/api'

/**
 * Default mock handlers for API routes
 */
export const handlers = [
    // Health check endpoint
    http.get(`${API_BASE}/health`, () => {
        return HttpResponse.json({ status: 'healthy', timestamp: new Date().toISOString() })
    }),

    // CSRF token endpoint
    http.get(`${API_BASE}/csrf`, () => {
        return HttpResponse.json({ token: 'mock-csrf-token' })
    }),

    // Rate limits endpoint
    http.get(`${API_BASE}/rate-limits`, ({ request }) => {
        const url = new URL(request.url)
        const isAuthenticated = url.searchParams.get('isAuthenticated') === 'true'

        return HttpResponse.json({
            remaining: isAuthenticated ? 990 : 4,
            limit: isAuthenticated ? 1000 : 5,
            resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
    }),

    // Models endpoint
    http.get(`${API_BASE}/models`, () => {
        return HttpResponse.json({
            models: [
                {
                    id: 'gpt-4.1-nano',
                    name: 'GPT-4.1 Nano',
                    provider: 'openai',
                    contextWindow: 128000,
                },
                {
                    id: 'claude-3-sonnet',
                    name: 'Claude 3 Sonnet',
                    provider: 'anthropic',
                    contextWindow: 200000,
                },
            ],
        })
    }),

    // User preferences
    http.get(`${API_BASE}/user-preferences`, () => {
        return HttpResponse.json({
            theme: 'dark',
            defaultModel: 'gpt-4.1-nano',
            systemPrompt: null,
        })
    }),

    http.post(`${API_BASE}/user-preferences`, async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({ success: true, data: body })
    }),

    // Create guest user
    http.post(`${API_BASE}/create-guest`, async ({ request }) => {
        const body = (await request.json()) as { userId?: string }
        return HttpResponse.json({
            success: true,
            userId: body.userId || 'mock-guest-id',
        })
    }),

    // Chat endpoint
    http.post(`${API_BASE}/chat`, async ({ request }) => {
        const body = (await request.json()) as { messages?: Array<{ content: string }> }

        // Return a mock streaming response
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            start(controller) {
                const chunks = [
                    'data: {"type":"text-delta","text":"Hello"}\n\n',
                    'data: {"type":"text-delta","text":" from"}\n\n',
                    'data: {"type":"text-delta","text":" AI!"}\n\n',
                    'data: {"type":"finish"}\n\n',
                ]

                chunks.forEach((chunk, index) => {
                    setTimeout(() => {
                        controller.enqueue(encoder.encode(chunk))
                        if (index === chunks.length - 1) {
                            controller.close()
                        }
                    }, index * 50)
                })
            },
        })

        return new HttpResponse(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        })
    }),

    // Create chat
    http.post(`${API_BASE}/create-chat`, async ({ request }) => {
        const body = (await request.json()) as { title?: string }
        return HttpResponse.json({
            success: true,
            chatId: 'mock-chat-id-123',
            title: body.title || 'New Chat',
        })
    }),

    // Toggle chat pin
    http.post(`${API_BASE}/toggle-chat-pin`, async ({ request }) => {
        const body = (await request.json()) as { chatId?: string; pinned?: boolean }
        return HttpResponse.json({
            success: true,
            chatId: body.chatId,
            pinned: body.pinned,
        })
    }),

    // Update chat model
    http.post(`${API_BASE}/update-chat-model`, async ({ request }) => {
        const body = (await request.json()) as { chatId?: string; model?: string }
        return HttpResponse.json({
            success: true,
            chatId: body.chatId,
            model: body.model,
        })
    }),

    // User keys status
    http.get(`${API_BASE}/user-key-status`, () => {
        return HttpResponse.json({
            openai: false,
            anthropic: false,
            google: false,
            mistral: false,
            perplexity: false,
        })
    }),

    // User keys
    http.post(`${API_BASE}/user-keys`, async ({ request }) => {
        const body = await request.json()
        return HttpResponse.json({ success: true, data: body })
    }),

    // Providers
    http.get(`${API_BASE}/providers`, () => {
        return HttpResponse.json({
            providers: [
                { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo'] },
                { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet'] },
                { id: 'google', name: 'Google', models: ['gemini-pro'] },
            ],
        })
    }),

    // Projects
    http.get(`${API_BASE}/projects`, () => {
        return HttpResponse.json({
            projects: [],
        })
    }),

    http.post(`${API_BASE}/projects`, async ({ request }) => {
        const body = (await request.json()) as { name?: string }
        return HttpResponse.json({
            success: true,
            projectId: 'mock-project-id',
            name: body.name,
        })
    }),
]

/**
 * Error handlers for testing error scenarios
 */
export const errorHandlers = {
    rateLimitExceeded: http.get(`${API_BASE}/rate-limits`, () => {
        return HttpResponse.json(
            { error: 'Rate limit exceeded', code: 'DAILY_LIMIT_REACHED' },
            { status: 429 }
        )
    }),

    serverError: http.post(`${API_BASE}/chat`, () => {
        return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }),

    unauthorized: http.get(`${API_BASE}/user-preferences`, () => {
        return HttpResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }),

    notFound: http.get(`${API_BASE}/models`, () => {
        return HttpResponse.json(
            { error: 'Not found' },
            { status: 404 }
        )
    }),
}
