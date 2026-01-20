/**
 * Unit Tests: SidebarItem Component
 * Tests for individual sidebar chat item with editing and menu
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarItem } from '@/app/components/layout/sidebar/sidebar-item'
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
    SidebarItemMenu: ({ chat, onStartEditing }: {
        chat: Chat;
        onStartEditing: () => void
    }) => (
        <button data-testid="mock-menu" onClick={onStartEditing}>
            Menu for {chat.title}
        </button>
    ),
}))

describe('SidebarItem Component', () => {
    const mockChat: Chat = {
        id: 'chat-123',
        title: 'Test Chat',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        user_id: 'user-1',
        model: 'gpt-4',
        pinned: false,
        project_id: null,
        public: false,
        pinned_at: null,
    }

    const defaultProps = {
        chat: mockChat,
        currentChatId: 'other-chat',
    }

    beforeEach(() => jest.clearAllMocks())

    describe('Rendering', () => {
        it('should render chat title', () => {
            render(<SidebarItem {...defaultProps} />)
            expect(screen.getByText('Test Chat')).toBeInTheDocument()
        })

        it('should render "Untitled Chat" when title is empty', () => {
            render(<SidebarItem {...defaultProps} chat={{ ...mockChat, title: '' }} />)
            expect(screen.getByText('Untitled Chat')).toBeInTheDocument()
        })

        it('should render link to chat', () => {
            render(<SidebarItem {...defaultProps} />)
            expect(screen.getByRole('link')).toHaveAttribute('href', '/c/chat-123')
        })

        it('should render menu', () => {
            render(<SidebarItem {...defaultProps} />)
            expect(screen.getByTestId('mock-menu')).toBeInTheDocument()
        })
    })

    describe('Active State', () => {
        it('should have active styling when currentChatId matches', () => {
            render(<SidebarItem {...defaultProps} currentChatId="chat-123" />)
            const container = screen.getByText('Test Chat').closest('div[class*="hover:bg"]')
            expect(container).toHaveClass('bg-accent')
        })

        it('should not have active styling when currentChatId differs', () => {
            render(<SidebarItem {...defaultProps} currentChatId="other-chat" />)
            const container = screen.getByText('Test Chat').closest('div[class*="hover:bg"]')
            expect(container).not.toHaveClass('bg-accent')
        })
    })

    describe('Editing Mode', () => {
        it('should enter edit mode when menu triggers onStartEditing', async () => {
            const user = userEvent.setup()
            render(<SidebarItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                expect(screen.getByRole('textbox')).toBeInTheDocument()
            })
        })

        it('should show input with current title in edit mode', async () => {
            const user = userEvent.setup()
            render(<SidebarItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                expect(screen.getByRole('textbox')).toHaveValue('Test Chat')
            })
        })

        it('should update input value when typing', async () => {
            const user = userEvent.setup()
            render(<SidebarItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            const input = screen.getByRole('textbox')
            await user.clear(input)
            await user.type(input, 'New Title')

            expect(input).toHaveValue('New Title')
        })

        it('should call updateTitle when Enter is pressed', async () => {
            const user = userEvent.setup()
            render(<SidebarItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            const input = screen.getByRole('textbox')
            await user.clear(input)
            await user.type(input, 'New Title{enter}')

            expect(mockUpdateTitle).toHaveBeenCalledWith('chat-123', 'New Title')
        })

        it('should cancel editing when Escape is pressed', async () => {
            const user = userEvent.setup()
            render(<SidebarItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            const input = screen.getByRole('textbox')
            await user.clear(input)
            await user.type(input, 'New Title')
            await user.keyboard('{Escape}')

            await waitFor(() => {
                expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
            })
        })

        it('should render save and cancel buttons in edit mode', async () => {
            const user = userEvent.setup()
            render(<SidebarItem {...defaultProps} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                const buttons = screen.getAllByRole('button')
                expect(buttons.length).toBeGreaterThanOrEqual(2)
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle null title', () => {
            render(<SidebarItem {...defaultProps} chat={{ ...mockChat, title: null as unknown as string }} />)
            expect(screen.getByText('Untitled Chat')).toBeInTheDocument()
        })

        it('should handle long titles', () => {
            const longTitle = 'A'.repeat(100)
            render(<SidebarItem {...defaultProps} chat={{ ...mockChat, title: longTitle }} />)
            expect(screen.getByText(longTitle)).toBeInTheDocument()
        })
    })
})
