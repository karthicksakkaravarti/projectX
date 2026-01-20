/**
 * Unit Tests: app/components/multi-chat/use-multi-chat.ts
 */

import { renderHook, act } from '@testing-library/react'
import { useMultiChat } from '@/app/components/multi-chat/use-multi-chat'

// Mock the toast function
jest.mock('@/components/ui/toast', () => ({
    toast: jest.fn(),
}))

// Mock useChat from @ai-sdk/react
const mockAppend = jest.fn()
const mockStop = jest.fn()

jest.mock('@ai-sdk/react', () => ({
    useChat: jest.fn(() => ({
        messages: [],
        isLoading: false,
        append: mockAppend,
        stop: mockStop,
    })),
}))

import { useChat } from '@ai-sdk/react'
import { toast } from '@/components/ui/toast'

describe('useMultiChat Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Basic functionality', () => {
        it('should return an empty array when no models are provided', () => {
            const { result } = renderHook(() => useMultiChat([]))
            expect(result.current).toEqual([])
        })

        it('should return ModelChat instances for provided models', () => {
            const models = [
                { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
                { id: 'claude', name: 'Claude', provider: 'anthropic' },
            ]

            const { result } = renderHook(() => useMultiChat(models))

            expect(result.current).toHaveLength(2)
            expect(result.current[0].model).toEqual(models[0])
            expect(result.current[1].model).toEqual(models[1])
        })

        it('should include messages array in each ModelChat', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            const { result } = renderHook(() => useMultiChat(models))

            expect(result.current[0].messages).toBeDefined()
            expect(Array.isArray(result.current[0].messages)).toBe(true)
        })

        it('should include isLoading state in each ModelChat', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            const { result } = renderHook(() => useMultiChat(models))

            expect(result.current[0].isLoading).toBe(false)
        })

        it('should include append function in each ModelChat', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            const { result } = renderHook(() => useMultiChat(models))

            expect(typeof result.current[0].append).toBe('function')
        })

        it('should include stop function in each ModelChat', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            const { result } = renderHook(() => useMultiChat(models))

            expect(typeof result.current[0].stop).toBe('function')
        })
    })

    describe('Model slicing', () => {
        it('should limit models to MAX_MODELS (10)', () => {
            const models = Array.from({ length: 15 }, (_, i) => ({
                id: `model-${i}`,
                name: `Model ${i}`,
                provider: 'provider',
            }))

            const { result } = renderHook(() => useMultiChat(models))

            // Should only return first 10 models
            expect(result.current.length).toBeLessThanOrEqual(10)
        })

        it('should work correctly with exactly 10 models', () => {
            const models = Array.from({ length: 10 }, (_, i) => ({
                id: `model-${i}`,
                name: `Model ${i}`,
                provider: 'provider',
            }))

            const { result } = renderHook(() => useMultiChat(models))

            expect(result.current).toHaveLength(10)
        })
    })

    describe('append function', () => {
        it('should call the underlying useChat append when invoked', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            const { result } = renderHook(() => useMultiChat(models))

            const message = { role: 'user', content: 'Hello' }
            const options = { body: { chatId: '123' } }

            act(() => {
                result.current[0].append(message, options)
            })

            expect(mockAppend).toHaveBeenCalledWith(message, options)
        })

        it('should work without options', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            const { result } = renderHook(() => useMultiChat(models))

            const message = { role: 'user', content: 'Hello' }

            act(() => {
                result.current[0].append(message)
            })

            expect(mockAppend).toHaveBeenCalledWith(message, undefined)
        })
    })

    describe('stop function', () => {
        it('should call the underlying useChat stop when invoked', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            const { result } = renderHook(() => useMultiChat(models))

            act(() => {
                result.current[0].stop()
            })

            expect(mockStop).toHaveBeenCalled()
        })
    })

    describe('useChat hook calls', () => {
        it('should create useChat hooks with correct API endpoint', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            renderHook(() => useMultiChat(models))

            // useChat should be called with the api endpoint
            expect(useChat).toHaveBeenCalledWith(
                expect.objectContaining({
                    api: '/api/chat',
                })
            )
        })

        it('should include onError callback in useChat options', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            renderHook(() => useMultiChat(models))

            // Verify onError is passed to useChat
            const calls = (useChat as jest.Mock).mock.calls
            const lastCall = calls[calls.length - 1][0]
            expect(lastCall.onError).toBeDefined()
            expect(typeof lastCall.onError).toBe('function')
        })
    })

    describe('Error handling', () => {
        it('should handle errors and show toast for valid models', () => {
            const models = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]

            renderHook(() => useMultiChat(models))

            // Get the onError callback from the last useChat call
            const calls = (useChat as jest.Mock).mock.calls
            const onError = calls[0][0].onError

            // Simulate an error
            const testError = new Error('API Error')
            onError(testError)

            expect(toast).toHaveBeenCalledWith({
                title: 'Error with GPT-4',
                description: 'API Error',
                status: 'error',
            })
        })
    })

    describe('Re-renders and memoization', () => {
        it('should update when models change', () => {
            const initialModels = [{ id: 'gpt-4', name: 'GPT-4', provider: 'openai' }]
            const newModels = [
                { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
                { id: 'claude', name: 'Claude', provider: 'anthropic' },
            ]

            const { result, rerender } = renderHook(
                ({ models }) => useMultiChat(models),
                { initialProps: { models: initialModels } }
            )

            expect(result.current).toHaveLength(1)

            rerender({ models: newModels })

            expect(result.current).toHaveLength(2)
        })

        it('should maintain model mapping correctly after rerender', () => {
            const models = [
                { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
                { id: 'claude', name: 'Claude', provider: 'anthropic' },
            ]

            const { result, rerender } = renderHook(() => useMultiChat(models))

            rerender()

            expect(result.current[0].model.id).toBe('gpt-4')
            expect(result.current[1].model.id).toBe('claude')
        })
    })

    describe('Edge cases', () => {
        it('should handle single model correctly', () => {
            const models = [{ id: 'single', name: 'Single Model', provider: 'test' }]

            const { result } = renderHook(() => useMultiChat(models))

            expect(result.current).toHaveLength(1)
            expect(result.current[0].model.id).toBe('single')
        })

        it('should preserve model configuration properties', () => {
            const models = [
                { id: 'test-model', name: 'Test Model', provider: 'test-provider' },
            ]

            const { result } = renderHook(() => useMultiChat(models))

            expect(result.current[0].model).toEqual({
                id: 'test-model',
                name: 'Test Model',
                provider: 'test-provider',
            })
        })
    })
})
