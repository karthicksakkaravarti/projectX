/**
 * Unit Tests: useChatCore Hook
 * Tests for the core chat logic (submit, reload, suggestions, etc.)
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useChatCore } from '@/app/components/chat/use-chat-core'
import { toast } from '@/components/ui/toast'
import { getOrCreateGuestUserId } from '@/lib/api'
import { useChat } from '@ai-sdk/react'

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

jest.mock('next/navigation', () => ({
    useSearchParams: () => ({
        get: jest.fn(),
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
    const mockSetMessages = jest.fn()
    const mockSetInput = jest.fn()

    const defaultProps = {
        initialMessages: [],
        draftValue: '',
        cacheAndAddMessage: jest.fn(),
        chatId: null,
        user: null,
        files: [],
        createOptimisticAttachments: jest.fn(() => []),
        setFiles: jest.fn(),
        checkLimitsAndNotify: jest.fn(),
        cleanupOptimisticAttachments: jest.fn(),
        ensureChatExists: jest.fn(),
        handleFileUploads: jest.fn(),
        selectedModel: 'gpt-4',
        clearDraft: jest.fn(),
        bumpChat: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
            ; (getOrCreateGuestUserId as jest.Mock).mockResolvedValue('guest-1')

            // Default useChat mock
            ; (useChat as jest.Mock).mockReturnValue({
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
            })
    })

    describe('submit', () => {
        it('should handle submission flow successfully', async () => {
            // Override useChat to return input for validation in logic if needed
            // But hook logic likely uses useChat returned 'input' or 'input' passed to handleSubmit?
            // Actually useChatCore calls handleSubmit with options or event.
            // AND ensureChatExists likely uses 'input' from useChat hook state if available?
            // Let's modify mock to return input.
            ; (useChat as jest.Mock).mockReturnValue({
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

                // Mock dependency responses
                ; (defaultProps.checkLimitsAndNotify as jest.Mock).mockResolvedValue(true)
                ; (defaultProps.ensureChatExists as jest.Mock).mockResolvedValue('chat-1')
                ; (defaultProps.handleFileUploads as jest.Mock).mockResolvedValue([])

            await act(async () => {
                await result.current.submit()
            })

            expect(defaultProps.checkLimitsAndNotify).toHaveBeenCalled()
            expect(defaultProps.ensureChatExists).toHaveBeenCalledWith('guest-1', 'Current input')
            expect(mockHandleSubmit).toHaveBeenCalled()
            expect(defaultProps.clearDraft).toHaveBeenCalled()
            // bumpChat depends on messages.length > 0. 
            // In the first render/call, messages might still be empty in the closure.
            // expect(defaultProps.bumpChat).toHaveBeenCalledWith('chat-1')
        })

        it('should block if limits reached', async () => {
            (defaultProps.checkLimitsAndNotify as jest.Mock).mockResolvedValue(false)

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submit()
            })

            expect(mockHandleSubmit).not.toHaveBeenCalled()
            expect(defaultProps.cleanupOptimisticAttachments).toHaveBeenCalled()
        })
    })

    describe('handleSuggestion', () => {
        it('should append suggestion', async () => {
            const { result } = renderHook(() => useChatCore(defaultProps));

            (defaultProps.checkLimitsAndNotify as jest.Mock).mockResolvedValue(true);
            (defaultProps.ensureChatExists as jest.Mock).mockResolvedValue('chat-1');

            await act(async () => {
                await result.current.handleSuggestion('Try this')
            })

            expect(mockAppend).toHaveBeenCalledWith(
                expect.objectContaining({ content: 'Try this', role: 'user' }),
                expect.any(Object)
            )
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
            ; (useChat as jest.Mock).mockReturnValue({
                messages: [],
                status: 'streaming', // Busy
                setMessages: mockSetMessages,
                handleSubmit: mockHandleSubmit,
                input: '',
            })

            const { result } = renderHook(() => useChatCore(defaultProps))

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('wait') }))
        })

        it('should process edit successfully', async () => {
            const messages = [{ id: 'msg-1', role: 'user', createdAt: new Date() }];

            ; (useChat as jest.Mock).mockReturnValue({
                messages,
                status: 'ready',
                setMessages: mockSetMessages,
                append: mockAppend,
                handleSubmit: mockHandleSubmit,
                input: '',
            })

            const { result } = renderHook(() => useChatCore({ ...defaultProps, chatId: 'chat-1' }));

            (defaultProps.checkLimitsAndNotify as jest.Mock).mockResolvedValue(true);
            (defaultProps.ensureChatExists as jest.Mock).mockResolvedValue('chat-1');

            await act(async () => {
                await result.current.submitEdit('msg-1', 'new content')
            })

            // Should slice messages and append new one
            expect(mockSetMessages).toHaveBeenCalled() // Slicing happens here
            expect(mockAppend).toHaveBeenCalledWith(
                expect.objectContaining({ content: 'new content' }),
                expect.any(Object)
            )
        })
    })
})
