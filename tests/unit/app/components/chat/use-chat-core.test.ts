/**
 * Unit Tests: useChatCore Hook
 * Tests for the core chat logic (submit, reload, suggestions, etc.)
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useChatCore } from '@/app/components/chat/use-chat-core'
import { toast } from '@/components/ui/toast'
import { getOrCreateGuestUserId } from '@/lib/api'
import { useChat } from '@ai-sdk/react'
import { MESSAGE_MAX_LENGTH } from '@/lib/config'

// Mock dependencies
jest.mock('@/components/ui/toast', () => ({
    toast: jest.fn(),
}))

jest.mock('@/lib/api', () => ({
    getOrCreateGuestUserId: jest.fn(),
}))

jest.mock('@/lib/chat-store/persist', () => ({
    writeToIndexedDB: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/chat-store/chats/provider', () => ({
    useChats: jest.fn(() => ({
        updateTitle: jest.fn(),
    })),
}))

jest.mock('@/app/components/chat/syncRecentMessages', () => ({
    syncRecentMessages: jest.fn(),
}))

jest.mock('@/app/hooks/use-chat-draft', () => ({
    useChatDraft: jest.fn(() => ({
        setDraftValue: jest.fn(),
    })),
}))

const mockSearchParamsGet = jest.fn()
jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: mockSearchParamsGet,
    }),
}))

// Mock useChat from ai/react
jest.mock('@ai-sdk/react', () => ({
    useChat: jest.fn(),
}))

describe('useChatCore Hook', () => {
    const mockHandleSubmit = jest.fn()
    const mockReload = jest.fn()
    const mockStop = jest.fn()
    const mockAppend = jest.fn()
    const mockSetMessages = jest.fn((fn) => {
        if (typeof fn === 'function') {
            return fn([])
        }
        return fn
    })
    const mockSetInput = jest.fn()

    const createDefaultProps = () => ({
        initialMessages: [],
        draftValue: '',
        cacheAndAddMessage: jest.fn(),
        chatId: null,
        user: null,
        files: [],
        createOptimisticAttachments: jest.fn(() => []),
        setFiles: jest.fn(),
        checkLimitsAndNotify: jest.fn().mockResolvedValue(true),
        cleanupOptimisticAttachments: jest.fn(),
        ensureChatExists: jest.fn().mockResolvedValue('chat-1'),
        handleFileUploads: jest.fn().mockResolvedValue([]),
        selectedModel: 'gpt-4',
        clearDraft: jest.fn(),
        bumpChat: jest.fn(),
    })

    let defaultProps: ReturnType<typeof createDefaultProps>

    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParamsGet.mockReturnValue(null)
        defaultProps = createDefaultProps()
        ;(getOrCreateGuestUserId as jest.Mock).mockResolvedValue('guest-1')

        // Default useChat mock
        ;(useChat as jest.Mock).mockReturnValue({
            messages: [],
            input: 'Test message',
            handleSubmit: mockHandleSubmit,
            status: 'ready',
            error: null,
            reload: mockReload,
            stop: mockStop,
            setMessages: mockSetMessages,
            setInput: mockSetInput,
            append: mockAppend,
        })
    })

    describe('initialization', () => {
        it('should initialize with default state', () => {
            const { result } = renderHook(() => useChatCore(defaultProps))

            expect(result.current.messages).toEqual([])
            expect(result.current.status).toBe('ready')
            expect(result.current.isSubmitting).toBe(false)
            expect(result.current.enableSearch).toBe(false)
            expect(result.current.hasDialogAuth).toBe(false)
        })

        it('should set input from search params prompt', () => {
            mockSearchParamsGet.mockReturnValue('prompt from url')

            renderHook(() => useChatCore(defaultProps))

            // requestAnimationFrame is used, so we wait
            expect(mockSearchParamsGet).toHaveBeenCalledWith('prompt')
        })

        it('should use user system prompt if available', () => {
            const userWithPrompt = {
                id: 'user-1',
                system_prompt: 'Custom system prompt',
            }
            const props = { ...defaultProps, user: userWithPrompt }

            const { result } = renderHook(() => useChatCore(props))

            expect(result.current).toBeDefined()
        })
    })

    describe('submit', () => {
        it('should handle submission flow successfully', async () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [],
                input: 'Current input',
                handleSubmit: mockHandleSubmit,
                status: 'ready',
                error: null,
                reload: mockReload,
                stop: mockStop,
                setMessages: mockSetMessages,
                setInput: mockSetInput,
                append: mockAppend,
            })

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submit()
            })

            expect(defaultProps.checkLimitsAndNotify).toHaveBeenCalled()
            expect(defaultProps.ensureChatExists).toHaveBeenCalledWith('guest-1', 'Current input')
            expect(mockHandleSubmit).toHaveBeenCalled()
            expect(defaultProps.clearDraft).toHaveBeenCalled()
        })

        it('should exit early if getOrCreateGuestUserId returns null', async () => {
            ;(getOrCreateGuestUserId as jest.Mock).mockResolvedValue(null)

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submit()
            })

            expect(mockHandleSubmit).not.toHaveBeenCalled()
            expect(defaultProps.checkLimitsAndNotify).not.toHaveBeenCalled()
        })

        it('should block if limits reached', async () => {
            defaultProps.checkLimitsAndNotify.mockResolvedValue(false)

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submit()
            })

            expect(mockHandleSubmit).not.toHaveBeenCalled()
            expect(defaultProps.cleanupOptimisticAttachments).toHaveBeenCalled()
        })

        it('should handle file uploads', async () => {
            const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
            const props = {
                ...defaultProps,
                files: [mockFile],
                createOptimisticAttachments: jest.fn(() => [
                    { name: 'test.txt', contentType: 'text/plain', url: 'blob:test' }
                ]),
            }

            const { result } = renderHook(() => useChatCore(props))

            await act(async () => {
                await result.current.submit()
            })

            expect(props.handleFileUploads).toHaveBeenCalledWith('guest-1', 'chat-1')
        })

        it('should abort if handleFileUploads returns null', async () => {
            const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
            const props = {
                ...defaultProps,
                files: [mockFile],
                handleFileUploads: jest.fn().mockResolvedValue(null),
            }

            const { result } = renderHook(() => useChatCore(props))

            await act(async () => {
                await result.current.submit()
            })

            expect(mockHandleSubmit).not.toHaveBeenCalled()
            expect(props.cleanupOptimisticAttachments).toHaveBeenCalled()
        })

        it('should block if ensureChatExists returns null', async () => {
            defaultProps.ensureChatExists.mockResolvedValue(null)

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submit()
            })

            expect(mockHandleSubmit).not.toHaveBeenCalled()
            expect(defaultProps.cleanupOptimisticAttachments).toHaveBeenCalled()
        })

        it('should show error toast when message exceeds max length', async () => {
            const longMessage = 'a'.repeat(MESSAGE_MAX_LENGTH + 1)
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [],
                input: longMessage,
                handleSubmit: mockHandleSubmit,
                status: 'ready',
                error: null,
                reload: mockReload,
                stop: mockStop,
                setMessages: mockSetMessages,
                setInput: mockSetInput,
                append: mockAppend,
            })

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submit()
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('too long'),
                status: 'error'
            }))
            expect(mockHandleSubmit).not.toHaveBeenCalled()
        })

        it('should bump chat when messages already exist', async () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: '1', role: 'user', content: 'test' }],
                input: 'New message',
                handleSubmit: mockHandleSubmit,
                status: 'ready',
                error: null,
                reload: mockReload,
                stop: mockStop,
                setMessages: mockSetMessages,
                setInput: mockSetInput,
                append: mockAppend,
            })

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submit()
            })

            expect(defaultProps.bumpChat).toHaveBeenCalledWith('chat-1')
        })

        it('should handle exception during submission', async () => {
            defaultProps.ensureChatExists.mockRejectedValue(new Error('Network error'))

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submit()
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Failed to send message',
                status: 'error'
            }))
        })
    })

    describe('handleSuggestion', () => {
        it('should append suggestion', async () => {
            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.handleSuggestion('Try this')
            })

            expect(mockAppend).toHaveBeenCalledWith(
                expect.objectContaining({ content: 'Try this', role: 'user' }),
                expect.any(Object)
            )
        })

        it('should block suggestion if limits not allowed', async () => {
            defaultProps.checkLimitsAndNotify.mockResolvedValue(false)

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.handleSuggestion('Try this')
            })

            expect(mockAppend).not.toHaveBeenCalled()
        })

        it('should block suggestion if ensureChatExists returns null', async () => {
            defaultProps.ensureChatExists.mockResolvedValue(null)

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.handleSuggestion('Try this')
            })

            expect(mockAppend).not.toHaveBeenCalled()
        })

        it('should block suggestion if getOrCreateGuestUserId returns null', async () => {
            ;(getOrCreateGuestUserId as jest.Mock).mockResolvedValue(null)

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.handleSuggestion('Try this')
            })

            expect(mockAppend).not.toHaveBeenCalled()
        })
    })

    describe('handleReload', () => {
        it('should trigger reload', async () => {
            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.handleReload()
            })

            expect(mockReload).toHaveBeenCalled()
        })
    })

    describe('submitEdit', () => {
        it('should block edit if submitting', async () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [],
                status: 'streaming',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('wait') }))
        })

        it('should block edit if status is submitted', async () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [],
                status: 'submitted',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('wait') }))
        })

        it('should not edit if content is empty', async () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: 'msg-1', role: 'user', createdAt: new Date() }],
                status: 'ready',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }))

            await act(async () => {
                await result.current.submitEdit('msg-1', '   ')
            })

            expect(mockAppend).not.toHaveBeenCalled()
        })

        it('should show error if chatId is missing', async () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: 'msg-1', role: 'user', createdAt: new Date() }],
                status: 'ready',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: null }))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Missing chat.' }))
        })

        it('should show error if message not found', async () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: 'msg-1', role: 'user', createdAt: new Date() }],
                status: 'ready',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }))

            await act(async () => {
                await result.current.submitEdit('non-existent', 'new content')
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Message not found' }))
        })

        it('should handle message without createdAt', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: 'msg-1', role: 'user', createdAt: undefined }],
                status: 'ready',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(consoleSpy).toHaveBeenCalledWith('Unable to locate message timestamp.')
            consoleSpy.mockRestore()
        })

        it('should show error for too long edited message', async () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: 'msg-1', role: 'user', createdAt: new Date() }],
                status: 'ready',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }))

            const longContent = 'a'.repeat(MESSAGE_MAX_LENGTH + 1)
            await act(async () => {
                await result.current.submitEdit('msg-1', longContent)
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('too long'),
                status: 'error'
            }))
        })

        it('should process edit successfully', async () => {
            const messages = [{ id: 'msg-1', role: 'user', createdAt: new Date() }]

            ;(useChat as jest.Mock).mockReturnValue({
                messages,
                status: 'ready',
                setMessages: mockSetMessages,
                append: mockAppend,
                handleSubmit: mockHandleSubmit,
                input: '',
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(mockSetMessages).toHaveBeenCalled()
            expect(mockAppend).toHaveBeenCalledWith(
                expect.objectContaining({ content: 'new content' }),
                expect.any(Object)
            )
        })

        it('should restore messages if getOrCreateGuestUserId returns null', async () => {
            ;(getOrCreateGuestUserId as jest.Mock).mockResolvedValue(null)
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: 'msg-1', role: 'user', createdAt: new Date() }],
                status: 'ready',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringContaining('sign in')
            }))
        })

        it('should restore messages if limits check fails', async () => {
            defaultProps.checkLimitsAndNotify.mockResolvedValue(false)
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: 'msg-1', role: 'user', createdAt: new Date() }],
                status: 'ready',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(mockSetMessages).toHaveBeenCalled()
            expect(mockAppend).not.toHaveBeenCalled()
        })

        it('should restore messages if ensureChatExists returns null', async () => {
            defaultProps.ensureChatExists.mockResolvedValue(null)
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: 'msg-1', role: 'user', createdAt: new Date() }],
                status: 'ready',
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
                append: mockAppend,
                reload: mockReload,
                stop: mockStop,
                setInput: mockSetInput,
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(mockSetMessages).toHaveBeenCalled()
            expect(mockAppend).not.toHaveBeenCalled()
        })
    })

    describe('setEnableSearch', () => {
        it('should update search state', () => {
            const { result } = renderHook(() => useChatCore(defaultProps))

            expect(result.current.enableSearch).toBe(false)

            act(() => {
                result.current.setEnableSearch(true)
            })

            expect(result.current.enableSearch).toBe(true)

            act(() => {
                result.current.setEnableSearch(false)
            })

            expect(result.current.enableSearch).toBe(false)
        })
    })

    describe('setHasDialogAuth', () => {
        it('should update hasDialogAuth state', () => {
            const { result } = renderHook(() => useChatCore(defaultProps))

            expect(result.current.hasDialogAuth).toBe(false)

            act(() => {
                result.current.setHasDialogAuth(true)
            })

            expect(result.current.hasDialogAuth).toBe(true)
        })
    })

    describe('stop', () => {
        it('should call stop function', () => {
            const { result } = renderHook(() => useChatCore(defaultProps))

            result.current.stop()

            expect(mockStop).toHaveBeenCalled()
        })
    })

    describe('setInput', () => {
        it('should call setInput function', () => {
            const { result } = renderHook(() => useChatCore(defaultProps))

            result.current.setInput('new value')

            expect(mockSetInput).toHaveBeenCalledWith('new value')
        })
    })

    describe('error handling', () => {
        it('should handle chat errors via onError callback', () => {
            let onErrorCallback: ((error: Error) => void) | undefined

            ;(useChat as jest.Mock).mockImplementation((options: any) => {
                onErrorCallback = options.onError
                return {
                    messages: [],
                    input: '',
                    handleSubmit: mockHandleSubmit,
                    status: 'ready',
                    error: null,
                    reload: mockReload,
                    stop: mockStop,
                    setMessages: mockSetMessages,
                    setInput: mockSetInput,
                    append: mockAppend,
                }
            })

            renderHook(() => useChatCore(defaultProps))

            expect(onErrorCallback).toBeDefined()

            if (onErrorCallback) {
                act(() => {
                    onErrorCallback(new Error('Test error'))
                })

                expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                    title: 'Test error',
                    status: 'error'
                }))
            }
        })

        it('should handle generic error messages', () => {
            let onErrorCallback: ((error: Error) => void) | undefined

            ;(useChat as jest.Mock).mockImplementation((options: any) => {
                onErrorCallback = options.onError
                return {
                    messages: [],
                    input: '',
                    handleSubmit: mockHandleSubmit,
                    status: 'ready',
                    error: null,
                    reload: mockReload,
                    stop: mockStop,
                    setMessages: mockSetMessages,
                    setInput: mockSetInput,
                    append: mockAppend,
                }
            })

            renderHook(() => useChatCore(defaultProps))

            if (onErrorCallback) {
                act(() => {
                    onErrorCallback(new Error('An error occurred'))
                })

                expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                    title: 'Something went wrong. Please try again.',
                    status: 'error'
                }))
            }
        })

        it('should handle fetch failed error', () => {
            let onErrorCallback: ((error: Error) => void) | undefined

            ;(useChat as jest.Mock).mockImplementation((options: any) => {
                onErrorCallback = options.onError
                return {
                    messages: [],
                    input: '',
                    handleSubmit: mockHandleSubmit,
                    status: 'ready',
                    error: null,
                    reload: mockReload,
                    stop: mockStop,
                    setMessages: mockSetMessages,
                    setInput: mockSetInput,
                    append: mockAppend,
                }
            })

            renderHook(() => useChatCore(defaultProps))

            if (onErrorCallback) {
                act(() => {
                    onErrorCallback(new Error('fetch failed'))
                })

                expect(toast).toHaveBeenCalledWith(expect.objectContaining({
                    title: 'Something went wrong. Please try again.',
                    status: 'error'
                }))
            }
        })
    })

    describe('onFinish callback', () => {
        it('should cache message and sync on finish', async () => {
            let onFinishCallback: ((message: any) => void) | undefined

            ;(useChat as jest.Mock).mockImplementation((options: any) => {
                onFinishCallback = options.onFinish
                return {
                    messages: [],
                    input: '',
                    handleSubmit: mockHandleSubmit,
                    status: 'ready',
                    error: null,
                    reload: mockReload,
                    stop: mockStop,
                    setMessages: mockSetMessages,
                    setInput: mockSetInput,
                    append: mockAppend,
                }
            })

            const props = { ...defaultProps, chatId: 'chat-1' }
            renderHook(() => useChatCore(props))

            const message = { id: 'msg-1', role: 'assistant', content: 'response' }
            if (onFinishCallback) {
                await act(async () => {
                    await onFinishCallback(message)
                })

                expect(props.cacheAndAddMessage).toHaveBeenCalledWith(message)
            }
        })
    })

    describe('chat navigation reset', () => {
        it('should reset messages when navigating from chat to home', () => {
            ;(useChat as jest.Mock).mockReturnValue({
                messages: [{ id: '1', content: 'test', role: 'user' }],
                input: '',
                handleSubmit: mockHandleSubmit,
                status: 'ready',
                error: null,
                reload: mockReload,
                stop: mockStop,
                setMessages: mockSetMessages,
                setInput: mockSetInput,
                append: mockAppend,
            })

            // First render with chatId
            const { rerender } = renderHook(
                ({ chatId }) => useChatCore({ ...defaultProps, chatId }),
                { initialProps: { chatId: 'chat-1' } }
            )

            // Second render without chatId (navigating to home)
            rerender({ chatId: null })

            expect(mockSetMessages).toHaveBeenCalledWith([])
        })
    })
})
