/**
 * Unit Tests: ProjectChatItem Component
 * Tests for project chat item with date formatting and editing
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectChatItem } from '@/app/components/layout/sidebar/project-chat-item'
import { Chat } from '@/lib/chat-store/types'

// Mock hooks
const mockUpdateTitle = jest.fn()

jest.mock('@/lib/chat-store/chats/provider', () => ({
    useChats: () => ({ updateTitle: mockUpdateTitle }),
}))

jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => false,
}))

jest.mock('@/app/hooks/use-click-outside', () => ({
    __esModule: true,
    default: jest.fn(),
}))

jest.mock('@/app/components/layout/sidebar/sidebar-item-menu', () => ({
    SidebarItemMenu: ({ onStartEditing }: { onStartEditing: () => void }) => (
        <button data-testid="mock-menu" onClick={onStartEditing}>Menu</button>
    ),
}))

describe('ProjectChatItem Component', () => {
    const mockChat: Chat = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-15T12:00:00Z',
        user_id: 'user-1',
        model: 'gpt-4',
        pinned: false,
        project_id: null,
        public: false,
        pinned_at: null,
    }

    const mockFormatDate = jest.fn((date: string) => `Formatted: ${date.slice(0, 10)}`)

    const defaultProps = {
        chat: mockChat,
        formatDate: mockFormatDate,
    }

    beforeEach(() => jest.clearAllMocks())

    describe('Rendering', () => {
        it('should render chat title', () => {
            render(<ProjectChatItem {...defaultProps} />)
            expect(screen.getByText('Test Chat')).toBeInTheDocument()
        })

        it('should render "Untitled Chat" for empty title', () => {
            render(<ProjectChatItem {...defaultProps} chat={{ ...mockChat, title: '' }} />)
            expect(screen.getByText('Untitled Chat')).toBeInTheDocument()
        })

        it('should render formatted date', () => {
            render(<ProjectChatItem {...defaultProps} />)
            expect(mockFormatDate).toHaveBeenCalledWith(mockChat.updated_at)
        })

        it('should use created_at if updated_at is not available', () => {
            render(<ProjectChatItem {...defaultProps} chat={{ ...mockChat, updated_at: undefined as unknown as string }} />)
            expect(mockFormatDate).toHaveBeenCalledWith(mockChat.created_at)
        })

        it('should render link to chat', () => {
            render(<ProjectChatItem {...defaultProps} />)
            expect(screen.getByRole('link')).toHaveAttribute('href', '/c/chat-123')
        })

        it('should render menu', () => {
            render(<ProjectChatItem {...defaultProps} />)
            expect(screen.getByTestId('mock-menu')).toBeInTheDocument()
        })
    })

    describe('Editing Mode', () => {
        it('should enter edit mode when menu triggers onStartEditing', async () => {
            const user = userEvent.setup()
            render(<ProjectChatItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                expect(screen.getByRole('textbox')).toBeInTheDocument()
            })
        })

        it('should show input with current title', async () => {
            const user = userEvent.setup()
            render(<ProjectChatItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                expect(screen.getByRole('textbox')).toHaveValue('Test Chat')
            })
        })

        it('should call updateTitle when Enter is pressed', async () => {
            const user = userEvent.setup()
            render(<ProjectChatItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            const input = screen.getByRole('textbox')
            await user.clear(input)
            await user.type(input, 'New Title{enter}')

            expect(mockUpdateTitle).toHaveBeenCalledWith('chat-123', 'New Title')
        })

        it('should cancel editing on Escape', async () => {
            const user = userEvent.setup()
            render(<ProjectChatItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            await user.keyboard('{Escape}')

            await waitFor(() => {
                expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
            })
        })

        it('should render save and cancel buttons in edit mode', async () => {
            const user = userEvent.setup()
            render(<ProjectChatItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                const buttons = screen.getAllByRole('button')
                expect(buttons.length).toBeGreaterThanOrEqual(2)
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle null title', () => {
            render(<ProjectChatItem {...defaultProps} chat={{ ...mockChat, title: null as unknown as string }} />)
            expect(screen.getByText('Untitled Chat')).toBeInTheDocument()
        })

        it('should handle missing dates', () => {
            const chatWithoutDates = {
                ...mockChat,
                updated_at: undefined as unknown as string,
                created_at: undefined as unknown as string
            }
            render(<ProjectChatItem {...defaultProps} chat={chatWithoutDates} />)
            expect(screen.getByText('Test Chat')).toBeInTheDocument()
        })
    })
})
