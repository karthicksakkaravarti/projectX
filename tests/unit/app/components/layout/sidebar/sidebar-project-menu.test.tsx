/**
 * Unit Tests: SidebarProjectMenu Component
 * Tests for the project dropdown menu with rename and delete actions
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarProjectMenu } from '@/app/components/layout/sidebar/sidebar-project-menu'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock hooks
jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => false,
}))

// Mock fetch
const mockFetchClient = jest.fn()
jest.mock('@/lib/fetch', () => ({
    fetchClient: (...args: unknown[]) => mockFetchClient(...args),
}))

describe('SidebarProjectMenu Component', () => {
    const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        user_id: 'user-456',
        created_at: '2024-01-01T00:00:00Z',
    }

    const mockOnStartEditing = jest.fn()
    const mockOnMenuOpenChange = jest.fn()

    const defaultProps = {
        project: mockProject,
        onStartEditing: mockOnStartEditing,
        onMenuOpenChange: mockOnMenuOpenChange,
    }

    let queryClient: QueryClient

    const renderWithQueryClient = (component: React.ReactElement) => {
        return render(
            <QueryClientProvider client={queryClient}>
                {component}
            </QueryClientProvider>
        )
    }

    beforeEach(() => {
        jest.clearAllMocks()
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
    })

    describe('Rendering', () => {
        it('should render menu trigger button', () => {
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} />)
            expect(screen.getByRole('button')).toBeInTheDocument()
        })

        it('should open dropdown menu on click', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} />)

            await user.click(screen.getByRole('button'))

            await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
        })

        it('should render Rename option', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} />)

            await user.click(screen.getByRole('button'))

            await waitFor(() => {
                expect(screen.getByRole('menuitem', { name: /Rename/i })).toBeInTheDocument()
            })
        })

        it('should render Delete option', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} />)

            await user.click(screen.getByRole('button'))

            await waitFor(() => {
                expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument()
            })
        })
    })

    describe('Rename Action', () => {
        it('should call onStartEditing when Rename is clicked', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} />)

            await user.click(screen.getByRole('button'))
            await waitFor(() => expect(screen.getByRole('menuitem', { name: /Rename/i })).toBeInTheDocument())
            await user.click(screen.getByRole('menuitem', { name: /Rename/i }))

            expect(mockOnStartEditing).toHaveBeenCalled()
        })
    })

    describe('Delete Action', () => {
        it('should open delete dialog when Delete is clicked', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} />)

            await user.click(screen.getByRole('button'))
            await waitFor(() => expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument())
            await user.click(screen.getByRole('menuitem', { name: /Delete/i }))

            await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument())
        })

        it('should display project name in delete dialog', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} />)

            await user.click(screen.getByRole('button'))
            await waitFor(() => expect(screen.getByRole('menuitem', { name: /Delete/i })).toBeInTheDocument())
            await user.click(screen.getByRole('menuitem', { name: /Delete/i }))

            await waitFor(() => expect(screen.getByText(/Test Project/)).toBeInTheDocument())
        })
    })

    describe('Menu Open Change', () => {
        it('should call onMenuOpenChange when menu opens', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} />)

            await user.click(screen.getByRole('button'))

            expect(mockOnMenuOpenChange).toHaveBeenCalledWith(true)
        })

        it('should work without onMenuOpenChange', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectMenu {...defaultProps} onMenuOpenChange={undefined} />)

            await user.click(screen.getByRole('button'))

            await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
        })
    })

    describe('Event Propagation', () => {
        it('should stop propagation on trigger click', async () => {
            const user = userEvent.setup()
            const parentClick = jest.fn()

            renderWithQueryClient(
                <div onClick={parentClick}>
                    <SidebarProjectMenu {...defaultProps} />
                </div>
            )

            await user.click(screen.getByRole('button'))

            expect(parentClick).not.toHaveBeenCalled()
        })
    })
})
