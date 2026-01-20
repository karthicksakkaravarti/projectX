/**
 * Unit Tests: SidebarItemMenu Component
 * Tests for the sidebar chat item dropdown menu
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarItemMenu } from '@/app/components/layout/sidebar/sidebar-item-menu'
import { Chat } from '@/lib/chat-store/types'

// Mock hooks
const mockDeleteMessages = jest.fn()
const mockDeleteChat = jest.fn()
const mockTogglePinned = jest.fn()

jest.mock('@/lib/chat-store/messages/provider', () => ({
    useMessages: () => ({ deleteMessages: mockDeleteMessages }),
}))

jest.mock('@/lib/chat-store/chats/provider', () => ({
    useChats: () => ({ deleteChat: mockDeleteChat, togglePinned: mockTogglePinned }),
}))

jest.mock('@/lib/chat-store/session/provider', () => ({
    useChatSession: () => ({ chatId: 'current-chat-id' }),
}))

jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => false,
}))

describe('SidebarItemMenu Component', () => {
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
        onStartEditing: jest.fn(),
        onMenuOpenChange: jest.fn(),
    }

    beforeEach(() => jest.clearAllMocks())

    it('should render menu trigger button', () => {
        render(<SidebarItemMenu {...defaultProps} />)
        expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should open dropdown menu on click', async () => {
        const user = userEvent.setup()
        render(<SidebarItemMenu {...defaultProps} />)
        await user.click(screen.getByRole('button'))
        await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
    })

    it('should render Pin option for unpinned chat', async () => {
        const user = userEvent.setup()
        render(<SidebarItemMenu {...defaultProps} />)
        await user.click(screen.getByRole('button'))
        await waitFor(() => expect(screen.getByRole('menuitem', { name: /Pin/i })).toBeInTheDocument())
    })

    it('should render Unpin option for pinned chat', async () => {
        const user = userEvent.setup()
        render(<SidebarItemMenu {...defaultProps} chat={{ ...mockChat, pinned: true }} />)
        await user.click(screen.getByRole('button'))
        await waitFor(() => expect(screen.getByRole('menuitem', { name: /Unpin/i })).toBeInTheDocument())
    })

    it('should call togglePinned when Pin is clicked', async () => {
        const user = userEvent.setup()
        render(<SidebarItemMenu {...defaultProps} />)
        await user.click(screen.getByRole('button'))
        await waitFor(() => expect(screen.getByRole('menuitem', { name: /Pin/i })).toBeInTheDocument())
        await user.click(screen.getByRole('menuitem', { name: /Pin/i }))
        expect(mockTogglePinned).toHaveBeenCalledWith('chat-123', true)
    })

    it('should call onStartEditing when Rename is clicked', async () => {
        const user = userEvent.setup()
        render(<SidebarItemMenu {...defaultProps} />)
        await user.click(screen.getByRole('button'))
        await waitFor(() => expect(screen.getByRole('menuitem', { name: /Rename/i })).toBeInTheDocument())
        await user.click(screen.getByRole('menuitem', { name: /Rename/i }))
        expect(defaultProps.onStartEditing).toHaveBeenCalled()
    })

    it('should open delete dialog when Delete is clicked', async () => {
        const user = userEvent.setup()
        render(<SidebarItemMenu {...defaultProps} />)
        await user.click(screen.getByRole('button'))
        await waitFor(() => expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument())
        await user.click(screen.getByRole('menuitem', { name: /Delete/i }))
        await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument())
    })

    it('should call onMenuOpenChange when menu opens', async () => {
        const user = userEvent.setup()
        render(<SidebarItemMenu {...defaultProps} />)
        await user.click(screen.getByRole('button'))
        expect(defaultProps.onMenuOpenChange).toHaveBeenCalledWith(true)
    })
})
