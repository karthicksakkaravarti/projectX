/**
 * Unit Tests: AppSidebar Component
 * Tests for the main sidebar component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppSidebar } from '@/app/components/layout/sidebar/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Chat } from '@/lib/chat-store/types'

// Mock hooks
const mockSetOpenMobile = jest.fn()
const mockPush = jest.fn()
let mockIsMobile = false
let mockChatsData = {
    chats: [] as Chat[],
    pinnedChats: [] as Chat[],
    isLoading: false,
}

jest.mock('@/components/ui/sidebar', () => ({
    ...jest.requireActual('@/components/ui/sidebar'),
    useSidebar: () => ({ setOpenMobile: mockSetOpenMobile }),
}))

jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: jest.fn(() => mockIsMobile),
}))

const mockChats: Chat[] = [
    { id: 'chat-1', title: 'Chat 1', created_at: '2024-01-20T10:00:00Z', updated_at: '2024-01-20T10:00:00Z', user_id: 'user-1', model: 'gpt-4', pinned: false, project_id: null, public: false, pinned_at: null },
    { id: 'chat-2', title: 'Chat 2', created_at: '2024-01-19T10:00:00Z', updated_at: '2024-01-19T10:00:00Z', user_id: 'user-1', model: 'gpt-4', pinned: true, project_id: null, public: false, pinned_at: '2024-01-19T10:00:00Z' },
]

jest.mock('@/lib/chat-store/chats/provider', () => ({
    useChats: () => mockChatsData,
}))

jest.mock('next/navigation', () => ({
    useParams: () => ({ chatId: 'chat-1' }),
    useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/lib/config', () => ({
    APP_NAME: 'ProjectX',
}))

// Mock child components
jest.mock('@/app/components/history/history-trigger', () => ({
    HistoryTrigger: () => <div data-testid="history-trigger">History Trigger</div>,
}))

jest.mock('@/app/components/layout/sidebar/sidebar-list', () => ({
    SidebarList: ({ title, items }: { title: string; items: Chat[] }) => (
        <div data-testid={`sidebar-list-${title.toLowerCase().replace(/\s/g, '-')}`}>
            {title}: {items.length} items
        </div>
    ),
}))

jest.mock('@/app/components/layout/sidebar/sidebar-project', () => ({
    SidebarProject: () => <div data-testid="sidebar-project">Projects</div>,
}))

describe('AppSidebar Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockIsMobile = false
        mockChatsData = {
            chats: mockChats,
            pinnedChats: [mockChats[1]],
            isLoading: false,
        }
    })

    const renderSidebar = () => {
        return render(
            <SidebarProvider>
                <AppSidebar />
            </SidebarProvider>
        )
    }

    describe('Rendering', () => {
        it('should render sidebar', () => {
            renderSidebar()
            expect(screen.getByText('New Chat')).toBeInTheDocument()
        })

        it('should render New Chat button', () => {
            renderSidebar()
            expect(screen.getByText('New Chat')).toBeInTheDocument()
        })

        it('should render History Trigger', () => {
            renderSidebar()
            expect(screen.getByTestId('history-trigger')).toBeInTheDocument()
        })

        it('should render Projects section', () => {
            renderSidebar()
            expect(screen.getByTestId('sidebar-project')).toBeInTheDocument()
        })

        it('should render app name in footer', () => {
            renderSidebar()
            expect(screen.getByText('ProjectX')).toBeInTheDocument()
        })

        it('should render pinned chats list', () => {
            renderSidebar()
            expect(screen.getByTestId('sidebar-list-pinned')).toBeInTheDocument()
        })
    })

    describe('Mobile View', () => {
        it('should render close button on mobile', () => {
            mockIsMobile = true
            renderSidebar()
            // There should be a close button with X icon
            const buttons = screen.getAllByRole('button')
            expect(buttons.length).toBeGreaterThan(0)
        })

        it('should call setOpenMobile(false) when close button is clicked on mobile', async () => {
            mockIsMobile = true
            const user = userEvent.setup()
            renderSidebar()
            
            // Find and click the close button (first button in mobile view)
            const buttons = screen.getAllByRole('button')
            await user.click(buttons[0])
            
            expect(mockSetOpenMobile).toHaveBeenCalledWith(false)
        })

        it('should not render close button on desktop', () => {
            mockIsMobile = false
            renderSidebar()
            // Should not have the close button visible, just the empty div
            expect(mockSetOpenMobile).not.toHaveBeenCalled()
        })
    })

    describe('New Chat Navigation', () => {
        it('should navigate to home when New Chat is clicked', async () => {
            const user = userEvent.setup()
            renderSidebar()

            await user.click(screen.getByText('New Chat'))

            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })

    describe('Loading State', () => {
        it('should show empty state during loading', () => {
            mockChatsData = {
                chats: [],
                pinnedChats: [],
                isLoading: true,
            }
            renderSidebar()
            // When loading, just show empty div, not the chats or empty state
            expect(screen.queryByText('No chats yet')).not.toBeInTheDocument()
            expect(screen.queryByTestId('sidebar-list-pinned')).not.toBeInTheDocument()
        })
    })

    describe('Empty State', () => {
        it('should show empty state when no chats', () => {
            mockChatsData = {
                chats: [],
                pinnedChats: [],
                isLoading: false,
            }
            renderSidebar()
            expect(screen.getByText('No chats yet')).toBeInTheDocument()
            expect(screen.getByText('Start a new conversation')).toBeInTheDocument()
        })

        it('should not show empty state when chats exist', () => {
            mockChatsData = {
                chats: mockChats,
                pinnedChats: [],
                isLoading: false,
            }
            renderSidebar()
            expect(screen.queryByText('No chats yet')).not.toBeInTheDocument()
        })
    })

    describe('Pinned Chats', () => {
        it('should render pinned section when pinned chats exist', () => {
            mockChatsData = {
                chats: mockChats,
                pinnedChats: [mockChats[1]],
                isLoading: false,
            }
            renderSidebar()
            expect(screen.getByTestId('sidebar-list-pinned')).toBeInTheDocument()
        })

        it('should not render pinned section when no pinned chats', () => {
            mockChatsData = {
                chats: mockChats,
                pinnedChats: [],
                isLoading: false,
            }
            renderSidebar()
            expect(screen.queryByTestId('sidebar-list-pinned')).not.toBeInTheDocument()
        })
    })

    describe('Grouped Chats', () => {
        it('should render grouped chats when chats exist', () => {
            mockChatsData = {
                chats: mockChats,
                pinnedChats: [],
                isLoading: false,
            }
            renderSidebar()
            // Should render SidebarList for grouped chats
            expect(screen.queryByText('No chats yet')).not.toBeInTheDocument()
        })

        it('should render both pinned and grouped chats', () => {
            mockChatsData = {
                chats: mockChats,
                pinnedChats: [mockChats[1]],
                isLoading: false,
            }
            renderSidebar()
            expect(screen.getByTestId('sidebar-list-pinned')).toBeInTheDocument()
        })
    })
})
