/**
 * Unit Tests: app/components/multi-chat/multi-conversation.tsx
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { MultiModelConversation } from '@/app/components/multi-chat/multi-conversation'

// Mock the chat container components
jest.mock('@/components/prompt-kit/chat-container', () => ({
    ChatContainerRoot: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="chat-container-root" className={className}>{children}</div>
    ),
    ChatContainerContent: ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
        <div data-testid="chat-container-content" className={className} style={style}>{children}</div>
    ),
}))

// Mock the Loader component
jest.mock('@/components/prompt-kit/loader', () => ({
    Loader: () => <div data-testid="loader">Loading...</div>,
}))

// Mock the ScrollButton component
jest.mock('@/components/prompt-kit/scroll-button', () => ({
    ScrollButton: ({ className }: { className?: string }) => (
        <button data-testid="scroll-button" className={className}>Scroll</button>
    ),
}))

// Mock the Message component
jest.mock('@/app/components/chat/message', () => ({
    Message: ({ children, variant, id, status }: {
        children: React.ReactNode
        variant: string
        id: string
        status?: string
    }) => (
        <div data-testid={`message-${id}`} data-variant={variant} data-status={status}>
            {children}
        </div>
    ),
}))

// Mock getModelInfo
jest.mock('@/lib/models', () => ({
    getModelInfo: (modelId: string) => ({
        id: modelId,
        name: modelId === 'gpt-4' ? 'GPT-4' : modelId === 'claude' ? 'Claude' : modelId,
        baseProviderId: modelId === 'gpt-4' ? 'openai' : modelId === 'claude' ? 'anthropic' : 'unknown',
    }),
}))

// Mock PROVIDERS
jest.mock('@/lib/providers', () => ({
    PROVIDERS: [
        { id: 'openai', icon: () => <span data-testid="openai-icon">O</span> },
        { id: 'anthropic', icon: () => <span data-testid="anthropic-icon">A</span> },
    ],
}))

// Mock cn utility
jest.mock('@/lib/utils', () => ({
    cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}))

describe('MultiModelConversation Component', () => {
    const createMockGroupedMessage = (overrides = {}) => ({
        userMessage: {
            id: 'user-1',
            role: 'user' as const,
            content: 'Hello, how are you?',
        },
        responses: [
            {
                model: 'gpt-4',
                message: {
                    id: 'assistant-1',
                    role: 'assistant' as const,
                    content: 'I am fine, thank you!',
                },
                isLoading: false,
                provider: 'openai',
            },
        ],
        onDelete: jest.fn(),
        onEdit: jest.fn(),
        onReload: jest.fn(),
        ...overrides,
    })

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render the chat container', () => {
            render(<MultiModelConversation messageGroups={[]} />)

            expect(screen.getByTestId('chat-container-root')).toBeInTheDocument()
            expect(screen.getByTestId('chat-container-content')).toBeInTheDocument()
        })

        it('should render nothing when messageGroups is empty', () => {
            render(<MultiModelConversation messageGroups={[]} />)

            expect(screen.queryByTestId(/message-/)).not.toBeInTheDocument()
        })

        it('should render user message', () => {
            const messageGroups = [createMockGroupedMessage()]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            expect(screen.getByTestId('message-user-1')).toBeInTheDocument()
            expect(screen.getByTestId('message-user-1')).toHaveAttribute('data-variant', 'user')
        })

        it('should render assistant message', () => {
            const messageGroups = [createMockGroupedMessage()]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            expect(screen.getByTestId('message-assistant-1')).toBeInTheDocument()
            expect(screen.getByTestId('message-assistant-1')).toHaveAttribute('data-variant', 'assistant')
        })

        it('should render scroll button', () => {
            render(<MultiModelConversation messageGroups={[]} />)

            expect(screen.getByTestId('scroll-button')).toBeInTheDocument()
        })
    })

    describe('Multiple responses', () => {
        it('should render multiple assistant responses for a single user message', () => {
            const messageGroups = [
                createMockGroupedMessage({
                    responses: [
                        {
                            model: 'gpt-4',
                            message: {
                                id: 'assistant-gpt',
                                role: 'assistant' as const,
                                content: 'GPT response',
                            },
                            isLoading: false,
                            provider: 'openai',
                        },
                        {
                            model: 'claude',
                            message: {
                                id: 'assistant-claude',
                                role: 'assistant' as const,
                                content: 'Claude response',
                            },
                            isLoading: false,
                            provider: 'anthropic',
                        },
                    ],
                }),
            ]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            expect(screen.getByTestId('message-assistant-gpt')).toBeInTheDocument()
            expect(screen.getByTestId('message-assistant-claude')).toBeInTheDocument()
        })
    })

    describe('Loading state', () => {
        it('should show loader when response is loading and no message yet', () => {
            const messageGroups = [
                createMockGroupedMessage({
                    responses: [
                        {
                            model: 'gpt-4',
                            message: null, // No message yet
                            isLoading: true,
                            provider: 'openai',
                        },
                    ],
                }),
            ]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            expect(screen.getByTestId('loader')).toBeInTheDocument()
        })

        it('should show streaming status when response is loading with message', () => {
            const messageGroups = [
                createMockGroupedMessage({
                    responses: [
                        {
                            model: 'gpt-4',
                            message: {
                                id: 'assistant-1',
                                role: 'assistant' as const,
                                content: 'Partial response...',
                            },
                            isLoading: true,
                            provider: 'openai',
                        },
                    ],
                }),
            ]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            const message = screen.getByTestId('message-assistant-1')
            expect(message).toHaveAttribute('data-status', 'streaming')
        })

        it('should show ready status when response is not loading', () => {
            const messageGroups = [createMockGroupedMessage()]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            const message = screen.getByTestId('message-assistant-1')
            expect(message).toHaveAttribute('data-status', 'ready')
        })
    })

    describe('Multiple message groups', () => {
        it('should render multiple conversation groups', () => {
            const messageGroups = [
                createMockGroupedMessage({
                    userMessage: { id: 'user-1', role: 'user' as const, content: 'First question' },
                    responses: [{
                        model: 'gpt-4',
                        message: { id: 'assistant-1', role: 'assistant' as const, content: 'First answer' },
                        isLoading: false,
                        provider: 'openai',
                    }],
                }),
                createMockGroupedMessage({
                    userMessage: { id: 'user-2', role: 'user' as const, content: 'Second question' },
                    responses: [{
                        model: 'gpt-4',
                        message: { id: 'assistant-2', role: 'assistant' as const, content: 'Second answer' },
                        isLoading: false,
                        provider: 'openai',
                    }],
                }),
            ]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            expect(screen.getByTestId('message-user-1')).toBeInTheDocument()
            expect(screen.getByTestId('message-user-2')).toBeInTheDocument()
            expect(screen.getByTestId('message-assistant-1')).toBeInTheDocument()
            expect(screen.getByTestId('message-assistant-2')).toBeInTheDocument()
        })
    })

    describe('Model information display', () => {
        it('should display model name in response card', () => {
            const messageGroups = [createMockGroupedMessage()]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            expect(screen.getByText('GPT-4')).toBeInTheDocument()
        })

        it('should display provider icon for known providers', () => {
            const messageGroups = [createMockGroupedMessage()]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            expect(screen.getByTestId('openai-icon')).toBeInTheDocument()
        })
    })

    describe('Waiting state', () => {
        it('should show waiting message when no response and not loading', () => {
            const messageGroups = [
                createMockGroupedMessage({
                    responses: [
                        {
                            model: 'gpt-4',
                            message: null,
                            isLoading: false,
                            provider: 'openai',
                        },
                    ],
                }),
            ]

            render(<MultiModelConversation messageGroups={messageGroups} />)

            expect(screen.getByText('Waiting for response...')).toBeInTheDocument()
        })
    })

    describe('Layout', () => {
        it('should apply wider max-width for multiple responses', () => {
            const messageGroups = [
                createMockGroupedMessage({
                    responses: [
                        {
                            model: 'gpt-4',
                            message: { id: 'a1', role: 'assistant' as const, content: 'Response 1' },
                            isLoading: false,
                            provider: 'openai',
                        },
                        {
                            model: 'claude',
                            message: { id: 'a2', role: 'assistant' as const, content: 'Response 2' },
                            isLoading: false,
                            provider: 'anthropic',
                        },
                    ],
                }),
            ]

            const { container } = render(<MultiModelConversation messageGroups={messageGroups} />)

            // Check that the container for multiple responses has max-w-[1800px] class
            const responsesContainer = container.querySelector('.max-w-\\[1800px\\]')
            expect(responsesContainer).toBeInTheDocument()
        })

        it('should apply standard max-width for single response', () => {
            const messageGroups = [createMockGroupedMessage()]

            const { container } = render(<MultiModelConversation messageGroups={messageGroups} />)

            // Check that the container for single response has max-w-3xl class
            const responsesContainer = container.querySelector('.max-w-3xl')
            expect(responsesContainer).toBeInTheDocument()
        })
    })

    describe('State updates', () => {
        it('should update when messageGroups change', () => {
            const initialGroups = [createMockGroupedMessage()]

            const { rerender } = render(<MultiModelConversation messageGroups={initialGroups} />)

            expect(screen.getByTestId('message-user-1')).toBeInTheDocument()

            const newGroups = [
                ...initialGroups,
                createMockGroupedMessage({
                    userMessage: { id: 'user-2', role: 'user' as const, content: 'New message' },
                    responses: [{
                        model: 'gpt-4',
                        message: { id: 'assistant-2', role: 'assistant' as const, content: 'New response' },
                        isLoading: false,
                        provider: 'openai',
                    }],
                }),
            ]

            rerender(<MultiModelConversation messageGroups={newGroups} />)

            expect(screen.getByTestId('message-user-2')).toBeInTheDocument()
            expect(screen.getByTestId('message-assistant-2')).toBeInTheDocument()
        })
    })
})
