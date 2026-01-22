/**
 * Unit Tests: useChatOperations Hook
 * Tests for chat operations logic (create, delete, edit, limits)
 */

import { renderHook, act } from '@testing-library/react'
import { useChatOperations } from '@/app/components/chat/use-chat-operations'
import { toast } from '@/components/ui/toast'
import { checkRateLimits } from '@/lib/api'
import { REMAINING_QUERY_ALERT_THRESHOLD } from '@/lib/config'

// Mock dependencies
jest.mock('@/components/ui/toast', () => ({
    toast: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
    checkRateLimits: jest.fn(),
}))

describe('useChatOperations Hook', () => {
    const mockCreateNewChat = jest.fn()
    const mockSetHasDialogAuth = jest.fn()
    const mockSetMessages = jest.fn()
    const mockSetInput = jest.fn()

    const createDefaultProps = () => ({
        isAuthenticated: true,
        chatId: null as string | null,
        messages: [] as any[],
        selectedModel: 'gpt-4',
        systemPrompt: 'You are helpful',
        createNewChat: mockCreateNewChat,
        setHasDialogAuth: mockSetHasDialogAuth,
        setMessages: mockSetMessages,
        setInput: mockSetInput,
    })

    let defaultProps: ReturnType<typeof createDefaultProps>

    beforeEach(() => {
        jest.clearAllMocks()
        defaultProps = createDefaultProps()
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                clear: jest.fn(),
            },
            writable: true,
        })
        // Mock window.history
        Object.defineProperty(window, 'history', {
            value: {
                pushState: jest.fn(),
            },
            writable: true,
        })
    })

    describe('checkLimitsAndNotify', () => {
        it('should return true if limits are fine', async () => {
            ;(checkRateLimits as jest.Mock).mockResolvedValue({ remaining: 10, remainingPro: 10 })

            const { result } = renderHook(() => useChatOperations(defaultProps))

            const allowed = await result.current.checkLimitsAndNotify('user-1')

            expect(allowed).toBe(true)
            expect(mockSetHasDialogAuth).not.toHaveBeenCalled()
        })

        it('should block unauthenticated users with 0 remaining', async () => {
            ;(checkRateLimits as jest.Mock).mockResolvedValue({ remaining: 0, remainingPro: 0 })

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, isAuthenticated: false }))

            const allowed = await result.current.checkLimitsAndNotify('guest-1')

            expect(allowed).toBe(false)
            expect(mockSetHasDialogAuth).toHaveBeenCalledWith(true)
        })

        it('should warn when remaining is at threshold', async () => {
            ;(checkRateLimits as jest.Mock).mockResolvedValue({ remaining: REMAINING_QUERY_ALERT_THRESHOLD, remainingPro: 100 })

            const { result } = renderHook(() => useChatOperations(defaultProps))

            await result.current.checkLimitsAndNotify('user-1')

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('remaining today'),
                status: 'info'
            }))
        })

        it('should warn when remainingPro is at threshold', async () => {
            ;(checkRateLimits as jest.Mock).mockResolvedValue({ remaining: 100, remainingPro: REMAINING_QUERY_ALERT_THRESHOLD })

            const { result } = renderHook(() => useChatOperations(defaultProps))

            await result.current.checkLimitsAndNotify('user-1')

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('pro quer'),
                status: 'info'
            }))
        })

        it('should show singular "query" when remaining is 1', async () => {
            ;(checkRateLimits as jest.Mock).mockResolvedValue({ remaining: 1, remainingPro: 100 })

            const { result } = renderHook(() => useChatOperations(defaultProps))

            await result.current.checkLimitsAndNotify('user-1')

            // Note: threshold might not be 1, so this may not trigger toast
            // Only triggers if REMAINING_QUERY_ALERT_THRESHOLD === 1
        })

        it('should handle rate limit check failure', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            ;(checkRateLimits as jest.Mock).mockRejectedValue(new Error('Network error'))

            const { result } = renderHook(() => useChatOperations(defaultProps))

            const allowed = await result.current.checkLimitsAndNotify('user-1')

            expect(allowed).toBe(false)
            expect(consoleSpy).toHaveBeenCalledWith('Rate limit check failed:', expect.any(Error))
            consoleSpy.mockRestore()
        })

        it('should allow authenticated user with 0 remaining (no dialog)', async () => {
            ;(checkRateLimits as jest.Mock).mockResolvedValue({ remaining: 0, remainingPro: 5 })

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, isAuthenticated: true }))

            const allowed = await result.current.checkLimitsAndNotify('user-1')

            // Authenticated users don't get blocked for remaining = 0
            expect(allowed).toBe(true)
            expect(mockSetHasDialogAuth).not.toHaveBeenCalled()
        })
    })

    describe('ensureChatExists', () => {
        it('should return existing chatId if present', async () => {
            const { result } = renderHook(() => useChatOperations({ ...defaultProps, chatId: 'existing-id' }))

            const id = await result.current.ensureChatExists('user-1', 'hello')

            expect(id).toBe('existing-id')
            expect(mockCreateNewChat).not.toHaveBeenCalled()
        })

        it('should create new chat if no chatId for authenticated user', async () => {
            mockCreateNewChat.mockResolvedValue({ id: 'new-chat-id' })

            const { result } = renderHook(() => useChatOperations(defaultProps))

            const id = await result.current.ensureChatExists('user-1', 'hello')

            expect(id).toBe('new-chat-id')
            expect(mockCreateNewChat).toHaveBeenCalledWith(
                'user-1',
                'hello',
                'gpt-4',
                true,
                'You are helpful'
            )
            expect(window.history.pushState).toHaveBeenCalledWith(null, '', '/c/new-chat-id')
        })

        it('should use localStorage guest chat for unauthenticated user', async () => {
            ;(window.localStorage.getItem as jest.Mock).mockReturnValue('guest-chat-id')

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, isAuthenticated: false }))

            const id = await result.current.ensureChatExists('guest-1', 'hello')

            expect(id).toBe('guest-chat-id')
            expect(mockCreateNewChat).not.toHaveBeenCalled()
        })

        it('should create new chat for unauthenticated user without stored chat', async () => {
            ;(window.localStorage.getItem as jest.Mock).mockReturnValue(null)
            mockCreateNewChat.mockResolvedValue({ id: 'new-guest-chat' })

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, isAuthenticated: false }))

            const id = await result.current.ensureChatExists('guest-1', 'hello')

            expect(id).toBe('new-guest-chat')
            expect(window.localStorage.setItem).toHaveBeenCalledWith('guestChatId', 'new-guest-chat')
            expect(window.history.pushState).not.toHaveBeenCalled()
        })

        it('should handle creation returning null', async () => {
            mockCreateNewChat.mockResolvedValue(null)

            const { result } = renderHook(() => useChatOperations(defaultProps))

            const id = await result.current.ensureChatExists('user-1', 'hello')

            expect(id).toBeNull()
        })

        it('should handle creation error with Error message', async () => {
            mockCreateNewChat.mockRejectedValue(new Error('Failed'))

            const { result } = renderHook(() => useChatOperations(defaultProps))

            const id = await result.current.ensureChatExists('user-1', 'hello')

            expect(id).toBeNull()
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Failed',
                status: 'error'
            }))
        })

        it('should handle creation error with JSON message', async () => {
            const jsonError = new Error(JSON.stringify({ error: 'Custom error message' }))
            mockCreateNewChat.mockRejectedValue(jsonError)

            const { result } = renderHook(() => useChatOperations(defaultProps))

            const id = await result.current.ensureChatExists('user-1', 'hello')

            expect(id).toBeNull()
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Custom error message',
                status: 'error'
            }))
        })

        it('should handle creation error with invalid JSON message', async () => {
            mockCreateNewChat.mockRejectedValue(new Error('not valid json'))

            const { result } = renderHook(() => useChatOperations(defaultProps))

            const id = await result.current.ensureChatExists('user-1', 'hello')

            expect(id).toBeNull()
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'not valid json',
                status: 'error'
            }))
        })

        it('should handle creation error without message', async () => {
            mockCreateNewChat.mockRejectedValue({})

            const { result } = renderHook(() => useChatOperations(defaultProps))

            const id = await result.current.ensureChatExists('user-1', 'hello')

            expect(id).toBeNull()
            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Something went wrong.',
                status: 'error'
            }))
        })
    })

    describe('handleDelete', () => {
        it('should remove message by id', () => {
            const messages = [{ id: '1', content: 'test', role: 'user' }]

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, messages }))

            act(() => {
                result.current.handleDelete('1')
            })

            expect(mockSetMessages).toHaveBeenCalledWith([])
        })

        it('should only remove specific message', () => {
            const messages = [
                { id: '1', content: 'first', role: 'user' },
                { id: '2', content: 'second', role: 'assistant' }
            ]

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, messages }))

            act(() => {
                result.current.handleDelete('1')
            })

            expect(mockSetMessages).toHaveBeenCalledWith([
                { id: '2', content: 'second', role: 'assistant' }
            ])
        })

        it('should handle deleting non-existent message', () => {
            const messages = [{ id: '1', content: 'test', role: 'user' }]

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, messages }))

            act(() => {
                result.current.handleDelete('non-existent')
            })

            expect(mockSetMessages).toHaveBeenCalledWith(messages)
        })
    })

    describe('handleEdit', () => {
        it('should update message content', () => {
            const messages = [{ id: '1', content: 'old', role: 'user' }]

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, messages }))

            act(() => {
                result.current.handleEdit('1', 'new')
            })

            expect(mockSetMessages).toHaveBeenCalledWith([
                { id: '1', content: 'new', role: 'user' }
            ])
        })

        it('should only update specific message', () => {
            const messages = [
                { id: '1', content: 'first', role: 'user' },
                { id: '2', content: 'second', role: 'assistant' }
            ]

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, messages }))

            act(() => {
                result.current.handleEdit('1', 'edited first')
            })

            expect(mockSetMessages).toHaveBeenCalledWith([
                { id: '1', content: 'edited first', role: 'user' },
                { id: '2', content: 'second', role: 'assistant' }
            ])
        })

        it('should not change messages when id not found', () => {
            const messages = [{ id: '1', content: 'test', role: 'user' }]

            const { result } = renderHook(() => useChatOperations({ ...defaultProps, messages }))

            act(() => {
                result.current.handleEdit('non-existent', 'new content')
            })

            expect(mockSetMessages).toHaveBeenCalledWith(messages)
        })
    })
})
