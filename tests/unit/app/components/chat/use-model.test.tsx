/**
 * Unit Tests: useModel Hook
 * Tests for model selection logic
 */

import { renderHook, act } from '@testing-library/react'
import { useModel } from '@/app/components/chat/use-model'
import { toast } from '@/components/ui/toast'
import { MODEL_DEFAULT } from '@/lib/config'

// Mock dependencies
jest.mock('@/components/ui/toast', () => ({
    toast: jest.fn(),
}))

jest.mock('@/lib/config', () => ({
    MODEL_DEFAULT: 'default-model',
}))

describe('useModel Hook', () => {
    const mockUpdateChatModel = jest.fn()

    const defaultProps = {
        currentChat: null,
        user: null,
        updateChatModel: mockUpdateChatModel,
        chatId: null,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('initial state', () => {
        it('should use default model if no user/chat', () => {
            const { result } = renderHook(() => useModel(defaultProps))
            expect(result.current.selectedModel).toBe('default-model')
        })

        it('should use user favorite model if available', () => {
            const user = { id: 'u1', favorite_models: ['fav-model'] } as any
            const { result } = renderHook(() => useModel({ ...defaultProps, user }))
            expect(result.current.selectedModel).toBe('fav-model')
        })

        it('should use chat model if available (priority)', () => {
            const user = { id: 'u1', favorite_models: ['fav-model'] } as any
            const currentChat = { id: 'c1', model: 'chat-model' } as any

            const { result } = renderHook(() => useModel({ ...defaultProps, user, currentChat }))
            expect(result.current.selectedModel).toBe('chat-model')
        })
    })

    describe('handleModelChange', () => {
        it('should update local state for unauthenticated users', async () => {
            const { result } = renderHook(() => useModel(defaultProps))

            await act(async () => {
                await result.current.handleModelChange('new-model')
            })

            expect(result.current.selectedModel).toBe('new-model')
            expect(mockUpdateChatModel).not.toHaveBeenCalled()
        })

        it('should persist change for authenticated user with chat', async () => {
            const user = { id: 'u1' } as any
            const chatId = 'c1'

            const { result } = renderHook(() => useModel({ ...defaultProps, user, chatId, updateChatModel: mockUpdateChatModel }))

            await act(async () => {
                await result.current.handleModelChange('new-model')
            })

            // Should optimistically update immediately? 
            // The hook sets local state, then awaits update.
            expect(mockUpdateChatModel).toHaveBeenCalledWith('c1', 'new-model')
        })

        it('should revert state on error', async () => {
            const user = { id: 'u1' } as any
            const chatId = 'c1'
            mockUpdateChatModel.mockRejectedValue(new Error('Fail'))

            const { result } = renderHook(() => useModel({ ...defaultProps, user, chatId, updateChatModel: mockUpdateChatModel }))

            await act(async () => {
                try {
                    await result.current.handleModelChange('new-model')
                } catch { }
            })

            expect(toast).toHaveBeenCalled()
            // Should allow reversion - checking implementation details:
            // It sets local state to null on error, falling back to effective model (default/chat model)
            expect(result.current.selectedModel).toBe('default-model')
        })

        it('should update local state for authenticated user WITHOUT chat', async () => {
            const user = { id: 'u1' } as any

            const { result } = renderHook(() => useModel({ ...defaultProps, user }))

            await act(async () => {
                await result.current.handleModelChange('temp-model')
            })

            expect(result.current.selectedModel).toBe('temp-model')
            expect(mockUpdateChatModel).not.toHaveBeenCalled()
        })
    })
})
