/**
 * Unit Tests: app/api/chat/utils.ts
 * Tests for chat API utility functions
 */

// Mock Response for Node.js environment
if (typeof global.Response === 'undefined') {
    global.Response = class MockResponse {
        body: string
        status: number

        constructor(body: string, init?: { status?: number }) {
            this.body = body
            this.status = init?.status || 200
        }

        async json() {
            return JSON.parse(this.body)
        }
    } as unknown as typeof Response
}

import {
    cleanMessagesForTools,
    messageHasToolContent,
    handleStreamError,
    extractErrorMessage,
    createErrorResponse
} from '@/app/api/chat/utils'
import type { Message as MessageAISDK } from '@/app/types/chat.types'

describe('Chat API Utils', () => {
    describe('cleanMessagesForTools', () => {
        const createMessage = (
            role: string,
            content: string | Array<{ type: string; text?: string }>,
            toolInvocations?: unknown[]
        ): MessageAISDK => ({
            id: 'msg-1',
            role: role as 'user' | 'assistant' | 'system',
            content: content as string,
            toolInvocations: toolInvocations as MessageAISDK['toolInvocations'],
        })

        describe('when hasTools is true', () => {
            it('should return messages unchanged', () => {
                const messages: MessageAISDK[] = [
                    createMessage('user', 'Hello'),
                    createMessage('assistant', 'Hi there', [{ toolName: 'test' }])
                ]

                const result = cleanMessagesForTools(messages, true)
                expect(result).toEqual(messages)
            })

            it('should preserve tool content when hasTools is true', () => {
                const messages: MessageAISDK[] = [
                    createMessage('assistant', [
                        { type: 'text', text: 'Response' },
                        { type: 'tool-call' }
                    ])
                ]

                const result = cleanMessagesForTools(messages, true)
                expect(result).toEqual(messages)
            })
        })

        describe('when hasTools is false', () => {
            it('should filter out tool messages', () => {
                const messages: MessageAISDK[] = [
                    createMessage('user', 'Hello'),
                    { id: 'tool-msg', role: 'tool' as unknown as 'user', content: 'tool result' },
                    createMessage('assistant', 'Hi there')
                ]

                const result = cleanMessagesForTools(messages, false)
                expect(result.length).toBe(2)
                expect(result.every(m => m.role !== 'tool')).toBe(true)
            })

            it('should remove toolInvocations from assistant messages', () => {
                const messages: MessageAISDK[] = [
                    createMessage('assistant', 'Response', [{ toolName: 'search' }])
                ]

                const result = cleanMessagesForTools(messages, false)
                expect(result[0].toolInvocations).toBeUndefined()
            })

            it('should filter tool-related content from array content', () => {
                const messages: MessageAISDK[] = [
                    {
                        id: 'msg-1',
                        role: 'assistant',
                        content: [
                            { type: 'text', text: 'Hello' },
                            { type: 'tool-call' },
                            { type: 'tool-result' }
                        ] as unknown as string
                    }
                ]

                const result = cleanMessagesForTools(messages, false)
                expect(result[0].content).toContain('Hello')
            })

            it('should provide fallback content when all content is tool-related', () => {
                const messages: MessageAISDK[] = [
                    {
                        id: 'msg-1',
                        role: 'assistant',
                        content: [
                            { type: 'tool-call' }
                        ] as unknown as string
                    }
                ]

                const result = cleanMessagesForTools(messages, false)
                expect(result[0].content).toBe('[Assistant response]')
            })

            it('should handle empty messages array', () => {
                const result = cleanMessagesForTools([], false)
                expect(result).toEqual([])
            })

            it('should preserve user messages', () => {
                const messages: MessageAISDK[] = [
                    createMessage('user', 'Hello, how are you?')
                ]

                const result = cleanMessagesForTools(messages, false)
                expect(result[0].content).toBe('Hello, how are you?')
            })
        })
    })

    describe('messageHasToolContent', () => {
        it('should return true for messages with toolInvocations', () => {
            const message: MessageAISDK = {
                id: 'msg-1',
                role: 'assistant',
                content: 'Response',
                toolInvocations: [{ toolName: 'search' }] as unknown as MessageAISDK['toolInvocations']
            }

            expect(messageHasToolContent(message)).toBe(true)
        })

        it('should return true for tool role messages', () => {
            const message = {
                id: 'msg-1',
                role: 'tool',
                content: 'Tool result'
            } as unknown as MessageAISDK

            expect(messageHasToolContent(message)).toBe(true)
        })

        it('should return true for messages with tool-call content', () => {
            const message: MessageAISDK = {
                id: 'msg-1',
                role: 'assistant',
                content: [{ type: 'tool-call' }] as unknown as string
            }

            expect(messageHasToolContent(message)).toBe(true)
        })

        it('should return true for messages with tool-result content', () => {
            const message: MessageAISDK = {
                id: 'msg-1',
                role: 'assistant',
                content: [{ type: 'tool-result' }] as unknown as string
            }

            expect(messageHasToolContent(message)).toBe(true)
        })

        it('should return true for messages with tool-invocation content', () => {
            const message: MessageAISDK = {
                id: 'msg-1',
                role: 'assistant',
                content: [{ type: 'tool-invocation' }] as unknown as string
            }

            expect(messageHasToolContent(message)).toBe(true)
        })

        it('should return false for messages without tool content', () => {
            const message: MessageAISDK = {
                id: 'msg-1',
                role: 'assistant',
                content: 'Regular response without tools'
            }

            expect(messageHasToolContent(message)).toBe(false)
        })

        it('should return false for user messages', () => {
            const message: MessageAISDK = {
                id: 'msg-1',
                role: 'user',
                content: 'Hello'
            }

            expect(messageHasToolContent(message)).toBe(false)
        })
    })

    describe('handleStreamError', () => {
        it('should handle 402 payment required errors', () => {
            const error = { error: { statusCode: 402 } }
            const result = handleStreamError(error)

            expect(result.statusCode).toBe(402)
            expect(result.code).toBe('PAYMENT_REQUIRED')
        })

        it('should handle 401 authentication errors', () => {
            const error = { error: { statusCode: 401 } }
            const result = handleStreamError(error)

            expect(result.statusCode).toBe(401)
            expect(result.code).toBe('AUTHENTICATION_ERROR')
        })

        it('should handle 429 rate limit errors', () => {
            const error = { error: { statusCode: 429 } }
            const result = handleStreamError(error)

            expect(result.statusCode).toBe(429)
            expect(result.code).toBe('RATE_LIMIT_EXCEEDED')
        })

        it('should handle other 4xx errors', () => {
            const error = { error: { statusCode: 400, message: 'Bad Request' } }
            const result = handleStreamError(error)

            expect(result.statusCode).toBe(400)
            expect(result.code).toBe('CLIENT_ERROR')
        })

        it('should handle 5xx server errors', () => {
            const error = { error: { statusCode: 500, message: 'Server Error' } }
            const result = handleStreamError(error)

            expect(result.statusCode).toBe(500)
            expect(result.code).toBe('SERVER_ERROR')
        })

        it('should handle unknown errors', () => {
            const result = handleStreamError({})

            expect(result.statusCode).toBe(500)
            expect(result.code).toBe('UNKNOWN_ERROR')
        })

        it('should extract detailed message from responseBody', () => {
            const error = {
                error: {
                    statusCode: 401,
                    responseBody: JSON.stringify({ error: { message: 'Invalid API key' } })
                }
            }
            const result = handleStreamError(error)

            expect(result.message).toBe('Invalid API key')
        })
    })

    describe('extractErrorMessage', () => {
        it('should return default message for null', () => {
            expect(extractErrorMessage(null)).toBe('An unknown error occurred.')
        })

        it('should return default message for undefined', () => {
            expect(extractErrorMessage(undefined)).toBe('An unknown error occurred.')
        })

        it('should return string errors as-is', () => {
            expect(extractErrorMessage('Custom error message')).toBe('Custom error message')
        })

        it('should extract message from Error objects', () => {
            const error = new Error('Test error message')
            expect(extractErrorMessage(error)).toBe('Test error message')
        })

        it('should detect authentication errors in message', () => {
            const error = new Error('invalid x-api-key provided')
            expect(extractErrorMessage(error)).toContain('Invalid API key')
        })

        it('should detect payment errors in message', () => {
            const error = new Error('402: payment required')
            expect(extractErrorMessage(error)).toContain('Insufficient credits')
        })

        it('should detect rate limit errors in message', () => {
            const error = new Error('429: rate limit exceeded')
            expect(extractErrorMessage(error)).toContain('Rate limit exceeded')
        })

        it('should handle AI SDK error objects with 401', () => {
            const error = { error: { statusCode: 401 } }
            expect(extractErrorMessage(error)).toContain('Invalid API key')
        })

        it('should handle AI SDK error objects with 402', () => {
            const error = { error: { statusCode: 402 } }
            expect(extractErrorMessage(error)).toContain('Insufficient credits')
        })

        it('should handle AI SDK error objects with 429', () => {
            const error = { error: { statusCode: 429 } }
            expect(extractErrorMessage(error)).toContain('Rate limit exceeded')
        })

        it('should return generic message for other errors', () => {
            const error = { someField: 'value' }
            expect(extractErrorMessage(error)).toBe('An error occurred. Please try again.')
        })
    })

    describe('createErrorResponse', () => {
        it('should handle DAILY_LIMIT_REACHED error', async () => {
            const error = {
                code: 'DAILY_LIMIT_REACHED',
                message: 'Daily limit exceeded'
            }

            const response = createErrorResponse(error)
            const data = await response.json()

            expect(response.status).toBe(403)
            expect(data.code).toBe('DAILY_LIMIT_REACHED')
        })

        it('should handle errors with statusCode', async () => {
            const error = {
                statusCode: 429,
                message: 'Rate limited',
                code: 'RATE_LIMIT'
            }

            const response = createErrorResponse(error)
            const data = await response.json()

            expect(response.status).toBe(429)
            expect(data.code).toBe('RATE_LIMIT')
        })

        it('should fallback to 500 for generic errors', async () => {
            const error = { message: 'Something went wrong' }

            const response = createErrorResponse(error)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBe('Something went wrong')
        })

        it('should use default message when none provided', async () => {
            const error = {}

            const response = createErrorResponse(error)
            const data = await response.json()

            expect(response.status).toBe(500)
            expect(data.error).toBe('Internal server error')
        })
    })
})
