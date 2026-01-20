/**
 * Unit Tests: MessageUser Component
 * Tests for user message rendering and editing
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageUser } from '@/app/components/chat/message-user'

// Mock dependencies
jest.mock('@/components/prompt-kit/message', () => ({
    Message: ({ children, className }: any) => <div className={className} data-testid="message-container">{children}</div>,
    MessageContent: ({ children, className }: any) => <div className={className} data-testid="message-content">{children}</div>,
    MessageActions: ({ children, className }: any) => <div className={className} data-testid="message-actions">{children}</div>,
    MessageAction: ({ children, tooltip }: any) => <div title={tooltip}>{children}</div>,
}))

jest.mock('@/components/motion-primitives/morphing-dialog', () => ({
    MorphingDialog: ({ children }: any) => <div>{children}</div>,
    MorphingDialogTrigger: ({ children }: any) => <div>{children}</div>,
    MorphingDialogContent: ({ children }: any) => <div>{children}</div>,
    MorphingDialogImage: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="dialog-image" />,
    MorphingDialogContainer: ({ children }: any) => <div>{children}</div>,
    MorphingDialogClose: ({ className }: any) => <button className={className}>Close</button>,
}))

jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt }: any) => <img src={src} alt={alt} data-testid="next-image" />,
}))

jest.mock('@phosphor-icons/react', () => ({
    Check: () => <span>IconCheck</span>,
    Copy: () => <span>IconCopy</span>,
    PencilSimpleIcon: () => <span>IconEdit</span>,
    PencilSimpleSlashIcon: () => <span>IconCancel</span>,
}))

describe('MessageUser Component', () => {
    const defaultProps = {
        children: 'User message content',
        copied: false,
        copyToClipboard: jest.fn(),
        id: '12345678-1234-1234-1234-123456789012',
        isUserAuthenticated: true,
        messageGroupId: null, // Allow editing
        onEdit: jest.fn(),
    }

    describe('rendering', () => {
        it('should render message content', () => {
            render(<MessageUser {...defaultProps} />)
            expect(screen.getByTestId('message-content')).toHaveTextContent('User message content')
        })

        it('should render copy button', () => {
            render(<MessageUser {...defaultProps} />)
            expect(screen.getByLabelText('Copy text')).toBeInTheDocument()
        })

        it('should render edit button if allowed', () => {
            render(<MessageUser {...defaultProps} />)
            expect(screen.getByLabelText('Edit message')).toBeInTheDocument()
        })

        it('should hide edit button if not authenticated', () => {
            render(<MessageUser {...defaultProps} isUserAuthenticated={false} />)
            expect(screen.queryByLabelText('Edit message')).not.toBeInTheDocument()
        })

        it('should hide edit button if part of message group (multi-model)', () => {
            render(<MessageUser {...defaultProps} messageGroupId="group-1" />)
            expect(screen.queryByLabelText('Edit message')).not.toBeInTheDocument()
        })
    })

    describe('editing', () => {
        it('should switch to edit mode on click', async () => {
            const user = userEvent.setup()
            render(<MessageUser {...defaultProps} />)

            await user.click(screen.getByLabelText('Edit message'))

            expect(screen.getByRole('textbox')).toBeInTheDocument()
            expect(screen.getByRole('textbox')).toHaveValue('User message content')
            expect(screen.getByText('Save')).toBeInTheDocument()
            expect(screen.getByText('Cancel')).toBeInTheDocument()
        })

        it('should valid save edit', async () => {
            const user = userEvent.setup()
            render(<MessageUser {...defaultProps} />)

            await user.click(screen.getByLabelText('Edit message'))

            const textarea = screen.getByRole('textbox')
            await user.clear(textarea)
            await user.type(textarea, 'Updated content')

            await user.click(screen.getByText('Save'))

            expect(defaultProps.onEdit).toHaveBeenCalledWith('12345678-1234-1234-1234-123456789012', 'Updated content')
        })

        it('should cancel edit', async () => {
            const user = userEvent.setup()
            render(<MessageUser {...defaultProps} />)

            await user.click(screen.getByLabelText('Edit message'))

            const textarea = screen.getByRole('textbox')
            await user.clear(textarea)
            await user.type(textarea, 'Changed but cancelled')

            await user.click(screen.getByText('Cancel'))

            expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
            expect(screen.getByTestId('message-content')).toHaveTextContent('User message content')
            expect(defaultProps.onEdit).not.toHaveBeenCalled()
        })

        it('should disable save if empty', async () => {
            const user = userEvent.setup()
            render(<MessageUser {...defaultProps} />)

            await user.click(screen.getByLabelText('Edit message'))

            const textarea = screen.getByRole('textbox')
            await user.clear(textarea)

            expect(screen.getByText('Save')).toBeDisabled()
        })
    })

    describe('attachments', () => {
        it('should render image attachments', () => {
            const attachments = [
                { name: 'image.png', contentType: 'image/png', url: 'img-url' }
            ]
            render(<MessageUser {...defaultProps} attachments={attachments as any} />)

            expect(screen.getByTestId('next-image')).toBeInTheDocument()
        })

        it('should render text attachments', () => {
            const attachments = [
                { name: 'text.txt', contentType: 'text/plain', url: 'data:text/plain;base64,aGVsbG8=' } // base64 'hello'
            ]
            render(<MessageUser {...defaultProps} attachments={attachments as any} />)

            expect(screen.getByText('aGVsbG8=')).toBeInTheDocument()
        })
    })
})
