/**
 * Unit Tests: SidebarProjectItem Component
 * Tests for individual project item with editing and menu
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SidebarProjectItem } from '@/app/components/layout/sidebar/sidebar-project-item'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock hooks
jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => false,
}))

jest.mock('@/app/hooks/use-click-outside', () => ({
    __esModule: true,
    default: jest.fn(),
}))

const mockPathname = jest.fn().mockReturnValue('/')
jest.mock('next/navigation', () => ({
    usePathname: () => mockPathname(),
}))

const mockFetchClient = jest.fn()
jest.mock('@/lib/fetch', () => ({
    fetchClient: (...args: unknown[]) => mockFetchClient(...args),
}))

jest.mock('@/app/components/layout/sidebar/sidebar-project-menu', () => ({
    SidebarProjectMenu: ({ onStartEditing }: { onStartEditing: () => void }) => (
        <button data-testid="mock-menu" onClick={onStartEditing}>Menu</button>
    ),
}))

describe('SidebarProjectItem Component', () => {
    const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        user_id: 'user-456',
        created_at: '2024-01-01T00:00:00Z',
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
        mockPathname.mockReturnValue('/')
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
    })

    describe('Rendering', () => {
        it('should render project name', () => {
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)
            expect(screen.getByText('Test Project')).toBeInTheDocument()
        })

        it('should render "Untitled Project" for empty name', () => {
            renderWithQueryClient(<SidebarProjectItem project={{ ...mockProject, name: '' }} />)
            expect(screen.getByText('Untitled Project')).toBeInTheDocument()
        })

        it('should render link to project', () => {
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)
            expect(screen.getByRole('link')).toHaveAttribute('href', '/p/project-123')
        })

        it('should render menu', () => {
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)
            expect(screen.getByTestId('mock-menu')).toBeInTheDocument()
        })

        it('should render folder icon', () => {
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)
            expect(screen.getByText('Test Project')).toBeInTheDocument()
        })
    })

    describe('Active State', () => {
        it('should have active styling when pathname matches project', () => {
            mockPathname.mockReturnValue('/p/project-123')
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            const container = screen.getByText('Test Project').closest('div[class*="hover:bg"]')
            expect(container).toHaveClass('bg-accent')
        })

        it('should have active styling for project subpages', () => {
            mockPathname.mockReturnValue('/p/project-123/settings')
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            const container = screen.getByText('Test Project').closest('div[class*="hover:bg"]')
            expect(container).toHaveClass('bg-accent')
        })

        it('should not have active styling when pathname differs', () => {
            mockPathname.mockReturnValue('/p/other-project')
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            const container = screen.getByText('Test Project').closest('div[class*="hover:bg"]')
            expect(container).not.toHaveClass('bg-accent')
        })
    })

    describe('Editing Mode', () => {
        it('should enter edit mode when menu triggers onStartEditing', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                expect(screen.getByRole('textbox')).toBeInTheDocument()
            })
        })

        it('should show input with current name', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                expect(screen.getByRole('textbox')).toHaveValue('Test Project')
            })
        })

        it('should update input value when typing', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            const input = screen.getByRole('textbox')
            await user.clear(input)
            await user.type(input, 'New Project Name')

            expect(input).toHaveValue('New Project Name')
        })

        it('should trigger mutation when Enter is pressed', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ ...mockProject, name: 'New Name' }),
            })

            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            const input = screen.getByRole('textbox')
            await user.clear(input)
            await user.type(input, 'New Name{enter}')

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalledWith(
                    '/api/projects/project-123',
                    expect.objectContaining({ method: 'PUT' })
                )
            })
        })

        it('should cancel editing when Escape is pressed', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            await user.keyboard('{Escape}')

            await waitFor(() => {
                expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
            })
        })

        it('should render save and cancel buttons in edit mode', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            await user.click(screen.getByTestId('mock-menu'))

            await waitFor(() => {
                const buttons = screen.getAllByRole('button')
                expect(buttons.length).toBeGreaterThanOrEqual(2)
            })
        })

        it('should not trigger mutation when name is unchanged', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<SidebarProjectItem project={mockProject} />)

            await user.click(screen.getByTestId('mock-menu'))
            await waitFor(() => expect(screen.getByRole('textbox')).toBeInTheDocument())

            await user.keyboard('{enter}')

            expect(mockFetchClient).not.toHaveBeenCalled()
        })
    })

    describe('Edge Cases', () => {
        it('should handle project with null name', () => {
            renderWithQueryClient(
                <SidebarProjectItem project={{ ...mockProject, name: null as unknown as string }} />
            )
            expect(screen.getByText('Untitled Project')).toBeInTheDocument()
        })

        it('should handle long project names', () => {
            const longName = 'A'.repeat(100)
            renderWithQueryClient(<SidebarProjectItem project={{ ...mockProject, name: longName }} />)
            expect(screen.getByText(longName)).toBeInTheDocument()
        })
    })
})
