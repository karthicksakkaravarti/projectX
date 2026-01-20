/**
 * Unit Tests: SidebarProject Component
 * Tests for the project list with create dialog
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarProject } from '@/app/components/layout/sidebar/sidebar-project'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock fetch for projects API
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock child components
jest.mock('@/app/components/layout/sidebar/dialog-create-project', () => ({
    DialogCreateProject: ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) => (
        isOpen ? <div data-testid="create-dialog">Create Dialog <button onClick={() => setIsOpen(false)}>Close</button></div> : null
    ),
}))

jest.mock('@/app/components/layout/sidebar/sidebar-project-item', () => ({
    SidebarProjectItem: ({ project }: { project: { id: string; name: string } }) => (
        <div data-testid={`project-item-${project.id}`}>{project.name}</div>
    ),
}))

describe('SidebarProject Component', () => {
    const mockProjects = [
        { id: 'project-1', name: 'First Project', user_id: 'user-1', created_at: '2024-01-01' },
        { id: 'project-2', name: 'Second Project', user_id: 'user-1', created_at: '2024-01-02' },
    ]

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
            defaultOptions: { queries: { retry: false, staleTime: 0 } },
        })
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockProjects),
        })
    })

    afterEach(() => {
        queryClient.clear()
    })

    describe('Rendering', () => {
        it('should render "New project" button', async () => {
            renderWithQueryClient(<SidebarProject />)
            expect(screen.getByText('New project')).toBeInTheDocument()
        })

        it('should fetch and render projects', async () => {
            renderWithQueryClient(<SidebarProject />)

            await waitFor(() => {
                expect(screen.getByTestId('project-item-project-1')).toBeInTheDocument()
                expect(screen.getByTestId('project-item-project-2')).toBeInTheDocument()
            })
        })

        it('should display project names', async () => {
            renderWithQueryClient(<SidebarProject />)

            await waitFor(() => {
                expect(screen.getByText('First Project')).toBeInTheDocument()
                expect(screen.getByText('Second Project')).toBeInTheDocument()
            })
        })

        it('should render empty list when no projects', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            })

            renderWithQueryClient(<SidebarProject />)

            await waitFor(() => {
                expect(screen.queryByTestId(/project-item-/)).not.toBeInTheDocument()
            })
        })
    })

    describe('Create Project Dialog', () => {
        it('should open create dialog when "New project" is clicked', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProject />)

            await user.click(screen.getByText('New project'))

            await waitFor(() => {
                expect(screen.getByTestId('create-dialog')).toBeInTheDocument()
            })
        })

        it('should close dialog when Close is clicked', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProject />)

            await user.click(screen.getByText('New project'))
            await waitFor(() => expect(screen.getByTestId('create-dialog')).toBeInTheDocument())

            await user.click(screen.getByText('Close'))

            await waitFor(() => {
                expect(screen.queryByTestId('create-dialog')).not.toBeInTheDocument()
            })
        })
    })

    describe('Loading State', () => {
        it('should not show projects while loading', () => {
            // Don't resolve fetch immediately
            mockFetch.mockReturnValue(new Promise(() => { }))

            renderWithQueryClient(<SidebarProject />)

            expect(screen.queryByTestId(/project-item-/)).not.toBeInTheDocument()
        })
    })

    describe('Error Handling', () => {
        it('should handle fetch error gracefully', async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ error: 'Failed' }),
            })

            renderWithQueryClient(<SidebarProject />)

            // Should still render the new project button
            expect(screen.getByText('New project')).toBeInTheDocument()
        })

        it('should handle network error', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'))

            renderWithQueryClient(<SidebarProject />)

            expect(screen.getByText('New project')).toBeInTheDocument()
        })
    })

    describe('API Calls', () => {
        it('should call /api/projects on mount', async () => {
            renderWithQueryClient(<SidebarProject />)

            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith('/api/projects')
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle single project', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([mockProjects[0]]),
            })

            renderWithQueryClient(<SidebarProject />)

            await waitFor(() => {
                expect(screen.getByTestId('project-item-project-1')).toBeInTheDocument()
                expect(screen.queryByTestId('project-item-project-2')).not.toBeInTheDocument()
            })
        })

        it('should handle many projects', async () => {
            const manyProjects = Array.from({ length: 20 }, (_, i) => ({
                id: `project-${i}`,
                name: `Project ${i}`,
                user_id: 'user-1',
                created_at: '2024-01-01',
            }))

            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(manyProjects),
            })

            renderWithQueryClient(<SidebarProject />)

            await waitFor(() => {
                expect(screen.getByTestId('project-item-project-0')).toBeInTheDocument()
                expect(screen.getByTestId('project-item-project-19')).toBeInTheDocument()
            })
        })
    })
})
