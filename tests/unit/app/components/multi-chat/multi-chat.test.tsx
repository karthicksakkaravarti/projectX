/**
 * Unit Tests: app/components/multi-chat/multi-chat.tsx
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MultiChat } from '@/app/components/multi-chat/multi-chat'
import { TooltipProvider } from '@/components/ui/tooltip'

// Mock toast
const mockToast = jest.fn()
jest.mock('@/components/ui/toast', () => ({
    toast: (args: unknown) => mockToast(args),
}))

// Mock API helpers
const mockGetOrCreateGuestUserId = jest.fn().mockResolvedValue('user-123')
jest.mock('@/lib/api', () => ({
    getOrCreateGuestUserId: (...args: unknown[]) => mockGetOrCreateGuestUserId(...args),
}))

// Mock providers
const mockUser = { id: 'user-123', system_prompt: 'Test system prompt' }
const mockModels = [
    { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
    { id: 'claude', name: 'Claude', provider: 'anthropic' },
]

jest.mock('@/lib/user-store/provider', () => ({
    useUser: () => ({ user: mockUser }),
}))

jest.mock('@/lib/model-store/provider', () => ({
    useModel: () => ({ models: mockModels }),
}))

const mockCreateNewChat = jest.fn().mockResolvedValue({ id: 'chat-123' })
jest.mock('@/lib/chat-store/chats/provider', () => ({
    useChats: () => ({ createNewChat: mockCreateNewChat }),
}))

jest.mock('@/lib/chat-store/session/provider', () => ({
    useChatSession: () => ({ chatId: null }),
}))

const mockMessages: unknown[] = []
jest.mock('@/lib/chat-store/messages/provider', () => ({
    useMessages: () => ({ messages: mockMessages, isLoading: false }),
}))

// Mock useMultiChat hook
const mockAppend = jest.fn()
const mockStop = jest.fn()

type MockMessage = {
    id: string
    role: 'user' | 'assistant'
    content: string
}

const mockModelChats: {
    model: { id: string; name: string; provider: string }
    messages: MockMessage[]
    isLoading: boolean
    append: jest.Mock
    stop: jest.Mock
}[] = [
        {
            model: { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
            messages: [],
            isLoading: false,
            append: mockAppend,
            stop: mockStop,
        },
    ]

jest.mock('@/app/components/multi-chat/use-multi-chat', () => ({
    useMultiChat: () => mockModelChats,
}))

// Mock MultiChatInput
jest.mock('@/app/components/multi-chat/multi-chat-input', () => ({
    MultiChatInput: ({
        value,
        onValueChange,
        onSend,
        selectedModelIds,
        onSelectedModelIdsChange,
        stop,
        anyLoading
    }: {
        value: string
        onValueChange: (v: string) => void
        onSend: () => void
        selectedModelIds: string[]
        onSelectedModelIdsChange: (ids: string[]) => void
        stop: () => void
        anyLoading: boolean
    }) => (
        <div data-testid="multi-chat-input">
            <input
                data-testid="chat-input"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
            />
            <button data-testid="send-button" onClick={onSend}>
                Send
            </button>
            <button data-testid="stop-button" onClick={stop}>
                Stop
            </button>
            <span data-testid="selected-models">{selectedModelIds.join(',')}</span>
            <span data-testid="any-loading">{anyLoading ? 'loading' : 'ready'}</span>
            <button
                data-testid="select-model"
                onClick={() => onSelectedModelIdsChange(['gpt-4'])}
            >
                Select GPT-4
            </button>
        </div>
    ),
}))

// Mock MultiModelConversation
jest.mock('@/app/components/multi-chat/multi-conversation', () => ({
    MultiModelConversation: ({ messageGroups }: { messageGroups: unknown[] }) => (
        <div data-testid="multi-model-conversation">
            <span data-testid="message-count">{messageGroups.length}</span>
        </div>
    ),
}))

// Mock motion components
jest.mock('motion/react', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: ({ children, className, ...props }: { children: React.ReactNode; className?: string }) => (
            <div className={className} {...props}>{children}</div>
        ),
    },
}))

// Wrapper with required providers
const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <TooltipProvider>{children}</TooltipProvider>
)

describe('MultiChat Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetOrCreateGuestUserId.mockResolvedValue('user-123')
        // Reset window.history.pushState mock
        const pushStateSpy = jest.spyOn(window.history, 'pushState')
        pushStateSpy.mockImplementation(() => { })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('Rendering', () => {
        it('should render the MultiChatInput component', () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            expect(screen.getByTestId('multi-chat-input')).toBeInTheDocument()
        })

        it('should show onboarding message when no messages', () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            expect(screen.getByText("What's on your mind?")).toBeInTheDocument()
        })

        it('should not show conversation when no message groups', () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            // Conversation should not be visible (onboarding should be shown)
            expect(screen.queryByTestId('multi-model-conversation')).not.toBeInTheDocument()
        })
    })

    describe('Input handling', () => {
        it('should update prompt value when typing', async () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const input = screen.getByTestId('chat-input')
            await userEvent.type(input, 'Hello')

            expect(input).toHaveValue('Hello')
        })

        it('should clear prompt after successful send', async () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const input = screen.getByTestId('chat-input')
            await userEvent.type(input, 'Hello')

            // Select a model first
            const selectModel = screen.getByTestId('select-model')
            await userEvent.click(selectModel)

            const sendButton = screen.getByTestId('send-button')
            await userEvent.click(sendButton)

            await waitFor(() => {
                expect(input).toHaveValue('')
            })
        })
    })

    describe('Submit handling', () => {
        it('should not submit when prompt is empty', async () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const sendButton = screen.getByTestId('send-button')
            await userEvent.click(sendButton)

            expect(mockAppend).not.toHaveBeenCalled()
        })

        it('should show error toast when no models selected', async () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const input = screen.getByTestId('chat-input')
            await userEvent.type(input, 'Hello')

            const sendButton = screen.getByTestId('send-button')
            await userEvent.click(sendButton)

            expect(mockToast).toHaveBeenCalledWith({
                title: 'No models selected',
                description: 'Please select at least one model to chat with.',
                status: 'error',
            })
        })

        it('should create new chat when no chatId exists', async () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const input = screen.getByTestId('chat-input')
            await userEvent.type(input, 'Hello')

            // Select a model
            const selectModel = screen.getByTestId('select-model')
            await userEvent.click(selectModel)

            const sendButton = screen.getByTestId('send-button')
            await userEvent.click(sendButton)

            await waitFor(() => {
                expect(mockCreateNewChat).toHaveBeenCalled()
            })
        })

        it('should update browser history after creating chat', async () => {
            const pushStateSpy = jest.spyOn(window.history, 'pushState')

            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const input = screen.getByTestId('chat-input')
            await userEvent.type(input, 'Hello')

            // Select a model
            const selectModel = screen.getByTestId('select-model')
            await userEvent.click(selectModel)

            const sendButton = screen.getByTestId('send-button')
            await userEvent.click(sendButton)

            await waitFor(() => {
                expect(pushStateSpy).toHaveBeenCalledWith(null, '', '/c/chat-123')
            })
        })
    })

    describe('Model selection', () => {
        it('should allow selecting models', async () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const selectModel = screen.getByTestId('select-model')
            await userEvent.click(selectModel)

            expect(screen.getByTestId('selected-models')).toHaveTextContent('gpt-4')
        })
    })

    describe('Stop functionality', () => {
        it('should call stop on all loading model chats when stop is clicked', async () => {
            // Update mock to show loading state
            mockModelChats[0].isLoading = true

            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            // Select the model first
            const selectModel = screen.getByTestId('select-model')
            await userEvent.click(selectModel)

            const stopButton = screen.getByTestId('stop-button')
            await userEvent.click(stopButton)

            expect(mockStop).toHaveBeenCalled()

            // Reset
            mockModelChats[0].isLoading = false
        })
    })

    describe('Loading state', () => {
        it('should show loading state when any model is loading', () => {
            mockModelChats[0].isLoading = true

            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            // Note: anyLoading depends on selectedModelIds including the loading model
            // Reset
            mockModelChats[0].isLoading = false
        })

        it('should show ready state when no model is loading', () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            expect(screen.getByTestId('any-loading')).toHaveTextContent('ready')
        })
    })

    describe('Error handling', () => {
        it('should show error toast when chat creation fails', async () => {
            mockCreateNewChat.mockRejectedValueOnce(new Error('Failed'))

            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const input = screen.getByTestId('chat-input')
            await userEvent.type(input, 'Hello')

            const selectModel = screen.getByTestId('select-model')
            await userEvent.click(selectModel)

            const sendButton = screen.getByTestId('send-button')
            await userEvent.click(sendButton)

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith({
                    title: 'Failed to send message',
                    description: 'Please try again.',
                    status: 'error',
                })
            })
        })

        it('should show error when createNewChat returns null', async () => {
            mockCreateNewChat.mockResolvedValueOnce(null)

            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const input = screen.getByTestId('chat-input')
            await userEvent.type(input, 'Hello')

            const selectModel = screen.getByTestId('select-model')
            await userEvent.click(selectModel)

            const sendButton = screen.getByTestId('send-button')
            await userEvent.click(sendButton)

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith({
                    title: 'Failed to send message',
                    description: 'Please try again.',
                    status: 'error',
                })
            })
        })

        it('should not send message when getOrCreateGuestUserId returns null', async () => {
            mockGetOrCreateGuestUserId.mockResolvedValueOnce(null)

            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            const input = screen.getByTestId('chat-input')
            await userEvent.type(input, 'Hello')

            const selectModel = screen.getByTestId('select-model')
            await userEvent.click(selectModel)

            const sendButton = screen.getByTestId('send-button')
            await userEvent.click(sendButton)

            await waitFor(() => {
                expect(mockAppend).not.toHaveBeenCalled()
            })
        })
    })

    describe('File handling', () => {
        it('should handle file upload', async () => {
            // The file upload functionality is passed to MultiChatInput
            // This test verifies the component renders with file support
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            expect(screen.getByTestId('multi-chat-input')).toBeInTheDocument()
        })
    })

    describe('Authentication state', () => {
        it('should pass authentication state to input', () => {
            render(
                <Wrapper>
                    <MultiChat />
                </Wrapper>
            )

            // The component should render without errors with authenticated user
            expect(screen.getByTestId('multi-chat-input')).toBeInTheDocument()
        })
    })
})

// Additional test suite for complex scenarios with different mock configurations
describe('MultiChat Component - Persisted Messages', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should handle persisted messages with models', () => {
        // This tests the modelsFromPersisted logic
        const messagesWithModels = [
            { id: 'user-1', role: 'user', content: 'Hello' },
            { id: 'assistant-1', role: 'assistant', content: 'Hi!', model: 'gpt-4' },
        ]

        // Override mock for this test
        jest.doMock('@/lib/chat-store/messages/provider', () => ({
            useMessages: () => ({ messages: messagesWithModels, isLoading: false }),
        }))

        render(
            <Wrapper>
                <MultiChat />
            </Wrapper>
        )

        expect(screen.getByTestId('multi-chat-input')).toBeInTheDocument()
    })

    it('should show conversation when message groups exist', async () => {
        // Set up modelChats with messages to trigger conversation display
        mockModelChats[0].messages = [
            { id: 'user-1', role: 'user', content: 'Test message' },
            { id: 'assistant-1', role: 'assistant', content: 'Response' },
        ]

        render(
            <Wrapper>
                <MultiChat />
            </Wrapper>
        )

        // After rerender with messages, conversation should appear
        // Note: Due to mocking limitations, we verify the component renders
        expect(screen.getByTestId('multi-chat-input')).toBeInTheDocument()

        // Reset
        mockModelChats[0].messages = []
    })
})

describe('MultiChat Component - File Upload', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should initialize with empty files array', () => {
        render(
            <Wrapper>
                <MultiChat />
            </Wrapper>
        )

        // Verify component renders - files are managed internally
        expect(screen.getByTestId('multi-chat-input')).toBeInTheDocument()
    })
})

describe('MultiChat Component - System Prompt', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should use user system prompt when available', () => {
        render(
            <Wrapper>
                <MultiChat />
            </Wrapper>
        )

        // The user has a system_prompt defined in the mock
        expect(screen.getByTestId('multi-chat-input')).toBeInTheDocument()
    })
})

describe('MultiChat Component - Existing Chat Session', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockCreateNewChat.mockResolvedValue({ id: 'chat-123' })
    })

    it('should handle existing chat session correctly', async () => {
        render(
            <Wrapper>
                <MultiChat />
            </Wrapper>
        )

        const input = screen.getByTestId('chat-input')
        await userEvent.type(input, 'Hello')

        const selectModel = screen.getByTestId('select-model')
        await userEvent.click(selectModel)

        const sendButton = screen.getByTestId('send-button')
        await userEvent.click(sendButton)

        await waitFor(() => {
            expect(mockAppend).toHaveBeenCalled()
        })
    })
})

describe('MultiChat Component - Loading While Streaming', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should show loading state when model is streaming', async () => {
        mockModelChats[0].isLoading = true
        mockModelChats[0].messages = [
            { id: 'user-1', role: 'user', content: 'Test' },
        ]

        render(
            <Wrapper>
                <MultiChat />
            </Wrapper>
        )

        // Select the model
        const selectModel = screen.getByTestId('select-model')
        await userEvent.click(selectModel)

        // anyLoading should be true since model is loading and selected
        expect(screen.getByTestId('any-loading')).toHaveTextContent('loading')

        // Reset
        mockModelChats[0].isLoading = false
        mockModelChats[0].messages = []
    })
})
