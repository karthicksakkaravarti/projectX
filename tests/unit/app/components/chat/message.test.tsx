/**
 * Unit Tests: Message Component
 * Tests for the Message component that delegates to MessageUser or MessageAssistant
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Message } from '@/app/components/chat/message'

// Mock dependencies
jest.mock('@/app/components/chat/message-assistant', () => ({
    MessageAssistant: ({ children, messageId, onQuote, copied, copyToClipboard }: any) => (
        <div data-testid="message-assistant" data-message-id={messageId}>
            <span>{children}</span>
            <button onClick={copyToClipboard} data-testid="copy-button">
                {copied ? 'Copied' : 'Copy'}
            </button>
            {onQuote && <button onClick={() => onQuote('text', messageId)} data-testid="quote-button">Quote</button>}
        </div>
    ),
}))

jest.mock('@/app/components/chat/message-user', () => ({
    MessageUser: ({ children, id, copied, copyToClipboard, onEdit }: any) => (
        <div data-testid="message-user" data-id={id}>
            <span>{children}</span>
            <button onClick={copyToClipboard} data-testid="copy-button">
                {copied ? 'Copied' : 'Copy'}
            </button>
            {onEdit && <button onClick={() => onEdit(id, 'new text')} data-testid="edit-button">Edit</button>}
        </div>
    ),
}))

// Mock clipboard API
// Navigator clipboard is mocked by defining it as configurable
const mockWriteText = jest.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: mockWriteText },
    writable: true,
    configurable: true,
})

describe('Message Component', () => {
    const defaultUserProps = {
        variant: 'user' as const,
        children: 'Hello, world!',
        id: 'msg-1',
        onDelete: jest.fn(),
        onEdit: jest.fn(),
        onReload: jest.fn(),
    }

    const defaultAssistantProps = {
        variant: 'assistant' as const,
        children: 'Hello, I am an assistant!',
        id: 'msg-2',
        onDelete: jest.fn(),
        onEdit: jest.fn(),
        onReload: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('variant routing', () => {
        it('should render MessageUser for user variant', () => {
            render(<Message {...defaultUserProps} />)

            expect(screen.getByTestId('message-user')).toBeInTheDocument()
            expect(screen.queryByTestId('message-assistant')).not.toBeInTheDocument()
        })

        it('should render MessageAssistant for assistant variant', () => {
            render(<Message {...defaultAssistantProps} />)

            expect(screen.getByTestId('message-assistant')).toBeInTheDocument()
            expect(screen.queryByTestId('message-user')).not.toBeInTheDocument()
        })

        it('should return null for unknown variants', () => {
            const { container } = render(
                <Message {...defaultUserProps} variant={'system' as any} />
            )

            expect(container.firstChild).toBeNull()
        })

        it('should return null for tool variant', () => {
            const { container } = render(
                <Message {...defaultUserProps} variant={'tool' as any} />
            )

            expect(container.firstChild).toBeNull()
        })
    })

    describe('copy to clipboard', () => {
        it('should copy content to clipboard when copy button is clicked', async () => {
            jest.useRealTimers()
            const user = userEvent.setup()
            render(<Message {...defaultUserProps} />)

            await user.click(screen.getByTestId('copy-button'))
            expect(mockWriteText).toHaveBeenCalledWith('Hello, world!')
        })

        it('should show copied state after clicking copy', async () => {
            render(<Message {...defaultUserProps} />)

            const copyButton = screen.getByTestId('copy-button')
            fireEvent.click(copyButton)

            expect(screen.getByText('Copied')).toBeInTheDocument()
        })

        it('should reset copied state after 500ms', async () => {
            render(<Message {...defaultUserProps} />)

            fireEvent.click(screen.getByTestId('copy-button'))
            expect(screen.getByText('Copied')).toBeInTheDocument()

            act(() => {
                jest.advanceTimersByTime(500)
            })

            expect(screen.getByText('Copy')).toBeInTheDocument()
        })
    })

    describe('props passing', () => {
        it('should pass id to message components', () => {
            render(<Message {...defaultUserProps} />)

            expect(screen.getByTestId('message-user')).toHaveAttribute('data-id', 'msg-1')
        })

        it('should pass onEdit to MessageUser', async () => {
            jest.useRealTimers()
            const user = userEvent.setup()
            const onEdit = jest.fn()
            render(<Message {...defaultUserProps} onEdit={onEdit} />)

            await user.click(screen.getByTestId('edit-button'))

            expect(onEdit).toHaveBeenCalledWith('msg-1', 'new text')
        })

        it('should pass onQuote to MessageAssistant', async () => {
            jest.useRealTimers()
            const user = userEvent.setup()
            const onQuote = jest.fn()
            render(<Message {...defaultAssistantProps} onQuote={onQuote} />)

            await user.click(screen.getByTestId('quote-button'))

            expect(onQuote).toHaveBeenCalledWith('text', 'msg-2')
        })

        it('should pass messageId to MessageAssistant', () => {
            render(<Message {...defaultAssistantProps} />)

            expect(screen.getByTestId('message-assistant')).toHaveAttribute('data-message-id', 'msg-2')
        })
    })

    describe('additional props', () => {
        it('should pass isLast to components', () => {
            render(<Message {...defaultAssistantProps} isLast={true} />)

            expect(screen.getByTestId('message-assistant')).toBeInTheDocument()
        })

        it('should pass hasScrollAnchor to components', () => {
            render(<Message {...defaultUserProps} hasScrollAnchor={true} />)

            expect(screen.getByTestId('message-user')).toBeInTheDocument()
        })

        it('should pass attachments to components', () => {
            const attachments = [
                { name: 'file.txt', contentType: 'text/plain', url: 'http://example.com/file.txt' }
            ]
            render(<Message {...defaultUserProps} attachments={attachments} />)

            expect(screen.getByTestId('message-user')).toBeInTheDocument()
        })

        it('should pass parts to MessageAssistant', () => {
            const parts = [{ type: 'text', text: 'Hello' }]
            render(<Message {...defaultAssistantProps} parts={parts as any} />)

            expect(screen.getByTestId('message-assistant')).toBeInTheDocument()
        })

        it('should pass status to MessageAssistant', () => {
            render(<Message {...defaultAssistantProps} status="streaming" />)

            expect(screen.getByTestId('message-assistant')).toBeInTheDocument()
        })

        it('should pass className to components', () => {
            render(<Message {...defaultUserProps} className="custom-class" />)

            expect(screen.getByTestId('message-user')).toBeInTheDocument()
        })

        it('should pass messageGroupId to MessageUser', () => {
            render(<Message {...defaultUserProps} messageGroupId="group-1" />)

            expect(screen.getByTestId('message-user')).toBeInTheDocument()
        })

        it('should pass isUserAuthenticated to MessageUser', () => {
            render(<Message {...defaultUserProps} isUserAuthenticated={true} />)

            expect(screen.getByTestId('message-user')).toBeInTheDocument()
        })
    })
})
