/**
 * Unit Tests: SidebarList Component
 * Tests for the sidebar chat list display
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { SidebarList } from '@/app/components/layout/sidebar/sidebar-list'
import { Chat } from '@/lib/chat-store/types'

// Mock SidebarItem component
jest.mock('@/app/components/layout/sidebar/sidebar-item', () => ({
    SidebarItem: ({ chat, currentChatId }: { chat: Chat; currentChatId: string }) => (
        <div data-testid={`sidebar-item-${chat.id}`} data-current={chat.id === currentChatId}>
            {chat.title}
        </div>
    ),
}))

describe('SidebarList Component', () => {
    const mockChats: Chat[] = [
        {
            id: 'chat-1',
            title: 'First Chat',
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T12:00:00Z',
            user_id: 'user-1',
            model: 'gpt-4',
            pinned: false,
            project_id: null,
            public: false,
            pinned_at: null,
        },
        {
            id: 'chat-2',
            title: 'Second Chat',
            created_at: '2024-01-02T10:00:00Z',
            updated_at: '2024-01-02T12:00:00Z',
            user_id: 'user-1',
            model: 'gpt-4',
            pinned: false,
            project_id: null,
            public: false,
            pinned_at: null,
        },
        {
            id: 'chat-3',
            title: 'Third Chat',
            created_at: '2024-01-03T10:00:00Z',
            updated_at: '2024-01-03T12:00:00Z',
            user_id: 'user-1',
            model: 'gpt-4',
            pinned: true,
            project_id: null,
            public: false,
            pinned_at: '2024-01-03T10:00:00Z',
        },
    ]

    const defaultProps = {
        title: 'Today',
        items: mockChats,
        currentChatId: 'chat-1',
    }

    describe('Rendering', () => {
        it('should render the list title', () => {
            render(<SidebarList {...defaultProps} />)

            expect(screen.getByText('Today')).toBeInTheDocument()
        })

        it('should render all chat items', () => {
            render(<SidebarList {...defaultProps} />)

            expect(screen.getByTestId('sidebar-item-chat-1')).toBeInTheDocument()
            expect(screen.getByTestId('sidebar-item-chat-2')).toBeInTheDocument()
            expect(screen.getByTestId('sidebar-item-chat-3')).toBeInTheDocument()
        })

        it('should render chat titles', () => {
            render(<SidebarList {...defaultProps} />)

            expect(screen.getByText('First Chat')).toBeInTheDocument()
            expect(screen.getByText('Second Chat')).toBeInTheDocument()
            expect(screen.getByText('Third Chat')).toBeInTheDocument()
        })

        it('should mark current chat correctly', () => {
            render(<SidebarList {...defaultProps} />)

            const currentItem = screen.getByTestId('sidebar-item-chat-1')
            expect(currentItem).toHaveAttribute('data-current', 'true')
        })

        it('should render with icon when provided', () => {
            const icon = <span data-testid="list-icon">📌</span>
            render(<SidebarList {...defaultProps} icon={icon} />)

            expect(screen.getByTestId('list-icon')).toBeInTheDocument()
        })

        it('should render without icon when not provided', () => {
            render(<SidebarList {...defaultProps} />)

            expect(screen.queryByTestId('list-icon')).not.toBeInTheDocument()
        })
    })

    describe('Different List Titles', () => {
        it('should render "Yesterday" title', () => {
            render(<SidebarList {...defaultProps} title="Yesterday" />)

            expect(screen.getByText('Yesterday')).toBeInTheDocument()
        })

        it('should render "Last 7 Days" title', () => {
            render(<SidebarList {...defaultProps} title="Last 7 Days" />)

            expect(screen.getByText('Last 7 Days')).toBeInTheDocument()
        })

        it('should render "Pinned" title with icon', () => {
            const pinIcon = <span data-testid="pin-icon">📌</span>
            render(<SidebarList {...defaultProps} title="Pinned" icon={pinIcon} />)

            expect(screen.getByText('Pinned')).toBeInTheDocument()
            expect(screen.getByTestId('pin-icon')).toBeInTheDocument()
        })
    })

    describe('Edge Cases', () => {
        it('should render empty list without errors', () => {
            render(<SidebarList {...defaultProps} items={[]} />)

            expect(screen.getByText('Today')).toBeInTheDocument()
            expect(screen.queryByTestId(/sidebar-item-/)).not.toBeInTheDocument()
        })

        it('should render with single item', () => {
            render(<SidebarList {...defaultProps} items={[mockChats[0]]} />)

            expect(screen.getByTestId('sidebar-item-chat-1')).toBeInTheDocument()
            expect(screen.queryByTestId('sidebar-item-chat-2')).not.toBeInTheDocument()
        })

        it('should handle long title', () => {
            const longTitle = 'A'.repeat(100)
            render(<SidebarList {...defaultProps} title={longTitle} />)

            expect(screen.getByText(longTitle)).toBeInTheDocument()
        })

        it('should handle special characters in title', () => {
            render(<SidebarList {...defaultProps} title="Today's Chats <special>" />)

            expect(screen.getByText("Today's Chats <special>")).toBeInTheDocument()
        })

        it('should handle currentChatId that does not match any item', () => {
            render(<SidebarList {...defaultProps} currentChatId="non-existent" />)

            const item1 = screen.getByTestId('sidebar-item-chat-1')
            expect(item1).toHaveAttribute('data-current', 'false')
        })
    })

    describe('Chat Item Props', () => {
        it('should pass currentChatId to all chat items', () => {
            render(<SidebarList {...defaultProps} currentChatId="chat-2" />)

            const item1 = screen.getByTestId('sidebar-item-chat-1')
            const item2 = screen.getByTestId('sidebar-item-chat-2')
            const item3 = screen.getByTestId('sidebar-item-chat-3')

            expect(item1).toHaveAttribute('data-current', 'false')
            expect(item2).toHaveAttribute('data-current', 'true')
            expect(item3).toHaveAttribute('data-current', 'false')
        })
    })

    describe('Styling', () => {
        it('should have proper title styling class', () => {
            render(<SidebarList {...defaultProps} />)

            const title = screen.getByText('Today')
            expect(title.tagName.toLowerCase()).toBe('h3')
        })

        it('should render items in a container', () => {
            render(<SidebarList {...defaultProps} />)

            const items = screen.getAllByTestId(/sidebar-item-/)
            expect(items).toHaveLength(3)
        })
    })
})
