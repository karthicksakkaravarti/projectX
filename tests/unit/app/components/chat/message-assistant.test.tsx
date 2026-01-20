/**
 * Unit Tests: MessageAssistant Component
 * Tests for assistant message rendering, including sources, reasoning, and tools
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MessageAssistant } from '@/app/components/chat/message-assistant'

// Mock dependencies
jest.mock('@/components/prompt-kit/message', () => ({
    Message: ({ children, className }: any) => <div className={className}>{children}</div>,
    MessageContent: ({ children }: any) => <div data-testid="message-content">{children}</div>,
    MessageActions: ({ children }: any) => <div data-testid="message-actions">{children}</div>,
    MessageAction: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/app/components/chat/reasoning', () => ({
    Reasoning: ({ reasoning }: any) => <div data-testid="reasoning">{reasoning}</div>,
}))

jest.mock('@/app/components/chat/tool-invocation', () => ({
    ToolInvocation: () => <div data-testid="tool-invocation" />,
}))

jest.mock('@/app/components/chat/sources-list', () => ({
    SourcesList: ({ sources }: any) => (
        <div data-testid="sources-list">
            {sources.map((s: any) => <div key={s.url}>{s.title}</div>)}
        </div>
    ),
}))

jest.mock('@/app/components/chat/search-images', () => ({
    SearchImages: () => <div data-testid="search-images" />,
}))

jest.mock('@/app/components/chat/quote-button', () => ({
    QuoteButton: ({ onQuote }: any) => <button onClick={onQuote} data-testid="quote-btn">Quote</button>,
}))

jest.mock('@/app/components/chat/useAssistantMessageSelection', () => ({
    useAssistantMessageSelection: () => ({
        selectionInfo: { text: 'quoted text', messageId: 'msg-1', position: { x: 0, y: 0 } },
        clearSelection: jest.fn(),
    }),
}))

jest.mock('@/lib/user-preference-store/provider', () => ({
    useUserPreferences: () => ({
        preferences: {
            multiModelEnabled: false,
            showToolInvocations: true,
        },
    }),
}))

describe('MessageAssistant Component', () => {
    const defaultProps = {
        children: 'Assistant response',
        messageId: 'msg-1',
        copyToClipboard: jest.fn(),
        onReload: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('rendering', () => {
        it('should render content', () => {
            render(<MessageAssistant {...defaultProps} />)
            expect(screen.getByTestId('message-content')).toHaveTextContent('Assistant response')
        })

        it('should render reasoning if present', () => {
            const parts = [{ type: 'reasoning', reasoning: 'Thought process' }]
            render(<MessageAssistant {...defaultProps} parts={parts as any} />)

            expect(screen.getByTestId('reasoning')).toHaveTextContent('Thought process')
        })

        it('should render tool invocations', () => {
            const parts = [{ type: 'tool-invocation', toolInvocation: {} }]
            render(<MessageAssistant {...defaultProps} parts={parts as any} />)

            expect(screen.getByTestId('tool-invocation')).toBeInTheDocument()
        })

        it('should render image search results', () => {
            const parts = [{
                type: 'tool-invocation',
                toolInvocation: {
                    state: 'result',
                    toolName: 'imageSearch',
                    result: { content: [{ type: 'images', results: [{}] }] }
                }
            }]
            render(<MessageAssistant {...defaultProps} parts={parts as any} />)

            expect(screen.getByTestId('search-images')).toBeInTheDocument()
        })

        it('should render sources', () => {
            const parts = [{
                type: 'source',
                source: { url: 'url', title: 'Source 1' }
            }]
            render(<MessageAssistant {...defaultProps} parts={parts as any} />)

            expect(screen.getByTestId('sources-list')).toHaveTextContent('Source 1')
        })
    })

    describe('actions', () => {
        it('should show reload button if isLast', () => {
            render(<MessageAssistant {...defaultProps} isLast={true} />)

            // Should be in MessageActions
            // Actions are mocked to render children.
            // Check for button with aria-label="Regenerate"
            expect(screen.getByLabelText('Regenerate')).toBeInTheDocument()
        })

        it('should not show actions if streaming', () => {
            render(<MessageAssistant {...defaultProps} status="streaming" isLast={true} />)

            // Wait, logic says: Boolean(isLastStreaming || contentNullOrEmpty) ? null : Actions
            // If streaming and last, Actions should NOT be rendered
            expect(screen.queryByTestId('message-actions')).not.toBeInTheDocument()
        })
    })

    describe('quoting', () => {
        it('should render quote button if selection exists', () => {
            render(<MessageAssistant {...defaultProps} onQuote={jest.fn()} />)
            expect(screen.getByTestId('quote-btn')).toBeInTheDocument()
        })

        it('should call onQuote click', () => {
            const onQuote = jest.fn()
            render(<MessageAssistant {...defaultProps} onQuote={onQuote} />)

            fireEvent.click(screen.getByTestId('quote-btn'))

            expect(onQuote).toHaveBeenCalledWith('quoted text', 'msg-1')
        })
    })
})
