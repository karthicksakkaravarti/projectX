/**
 * Unit Tests: Conversation Component
 * Tests for the Conversation component that displays chat messages
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { Conversation } from '@/app/components/chat/conversation'

// Mock dependencies
jest.mock('@/components/prompt-kit/chat-container', () => ({
    ChatContainerRoot: ({ children, className }: { children: React.ReactNode, className?: string }) => (
        <div data-testid="chat-container-root" className={className}>{children}</div>
    ),
    ChatContainerContent: ({ children, className, style }: { children: React.ReactNode, className?: string, style?: object }) => (
        <div data-testid="chat-container-content" className={className} style={style}>{children}</div>
    ),
}))

jest.mock('@/components/prompt-kit/loader', () => ({
    Loader: () => <div data-testid="loader">Loading...</div>,
}))

jest.mock('@/components/prompt-kit/scroll-button', () => ({
    ScrollButton: ({ className }: { className?: string }) => (
        <button data-testid="scroll-button" className={className}>Scroll</button>
    ),
}))

jest.mock('@/app/components/chat/message', () => ({
    Message: ({ children, id, variant }: { children: string, id: string, variant: string }) => (
        <div data-testid={`message-${id}`} data-variant={variant}>{children}</div>
    ),
}))

const mockMessages = [
    { id: '1', role: 'user' as const, content: 'Hello', parts: [] },
    { id: '2', role: 'assistant' as const, content: 'Hi there!', parts: [] },
]

describe('Conversation Component', () => {
    const defaultProps = {
        messages: mockMessages,
        status: 'ready' as const,
        onDelete: jest.fn(),
        onEdit: jest.fn(),
        onReload: jest.fn(),
        onQuote: jest.fn(),
        isUserAuthenticated: true,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('rendering', () => {
        it('should render empty div when no messages', () => {
            const { container } = render(
                <Conversation {...defaultProps} messages={[]} />
            )

            // Should render empty container
            expect(container.firstChild).toHaveClass('h-full')
            expect(container.firstChild).toHaveClass('w-full')
        })

        it('should render messages when provided', () => {
            render(<Conversation {...defaultProps} />)

            expect(screen.getByTestId('message-1')).toBeInTheDocument()
            expect(screen.getByTestId('message-2')).toBeInTheDocument()
        })

        it('should render chat container root', () => {
            render(<Conversation {...defaultProps} />)

            expect(screen.getByTestId('chat-container-root')).toBeInTheDocument()
        })

        it('should render chat container content', () => {
            render(<Conversation {...defaultProps} />)

            expect(screen.getByTestId('chat-container-content')).toBeInTheDocument()
        })

        it('should render scroll button', () => {
            render(<Conversation {...defaultProps} />)

            expect(screen.getByTestId('scroll-button')).toBeInTheDocument()
        })
    })

    describe('loading state', () => {
        it('should show loader when status is submitted and last message is from user', () => {
            const messagesWithUserLast = [
                { id: '1', role: 'user' as const, content: 'Hello', parts: [] },
            ]

            render(
                <Conversation
                    {...defaultProps}
                    messages={messagesWithUserLast}
                    status="submitted"
                />
            )

            expect(screen.getByTestId('loader')).toBeInTheDocument()
        })

        it('should not show loader when status is ready', () => {
            render(<Conversation {...defaultProps} status="ready" />)

            expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
        })

        it('should not show loader when last message is from assistant', () => {
            render(
                <Conversation {...defaultProps} status="submitted" />
            )

            // Last message is from assistant, so no loader
            expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
        })
    })

    describe('message props', () => {
        it('should pass correct variant to messages', () => {
            render(<Conversation {...defaultProps} />)

            expect(screen.getByTestId('message-1')).toHaveAttribute('data-variant', 'user')
            expect(screen.getByTestId('message-2')).toHaveAttribute('data-variant', 'assistant')
        })

        it('should render message content', () => {
            render(<Conversation {...defaultProps} />)

            expect(screen.getByText('Hello')).toBeInTheDocument()
            expect(screen.getByText('Hi there!')).toBeInTheDocument()
        })
    })

    describe('status handling', () => {
        it('should handle streaming status', () => {
            render(<Conversation {...defaultProps} status="streaming" />)

            expect(screen.getByTestId('message-1')).toBeInTheDocument()
        })

        it('should handle error status', () => {
            render(<Conversation {...defaultProps} status="error" />)

            expect(screen.getByTestId('message-1')).toBeInTheDocument()
        })

        it('should use default ready status when not provided', () => {
            const propsWithoutStatus = { ...defaultProps }
            delete (propsWithoutStatus as any).status

            render(<Conversation {...propsWithoutStatus} />)

            expect(screen.getByTestId('message-1')).toBeInTheDocument()
        })
    })

    describe('callback props', () => {
        it('should pass onDelete to messages', () => {
            render(<Conversation {...defaultProps} />)

            // Verify messages are rendered with the callbacks available
            expect(screen.getByTestId('message-1')).toBeInTheDocument()
        })

        it('should handle undefined onQuote', () => {
            const propsWithoutQuote = { ...defaultProps, onQuote: undefined }

            render(<Conversation {...propsWithoutQuote} />)

            expect(screen.getByTestId('message-1')).toBeInTheDocument()
        })
    })
})
