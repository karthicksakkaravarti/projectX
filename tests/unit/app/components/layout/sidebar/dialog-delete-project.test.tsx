/**
 * Unit Tests: DialogDeleteProject Component
 * Tests for the delete project confirmation dialog with mutation handling
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogDeleteProject } from '@/app/components/layout/sidebar/dialog-delete-project'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock next/navigation
const mockPush = jest.fn()
const mockPathname = jest.fn().mockReturnValue('/')

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    usePathname: () => mockPathname(),
}))

// Mock fetchClient
const mockFetchClient = jest.fn()
jest.mock('@/lib/fetch', () => ({
    fetchClient: (...args: unknown[]) => mockFetchClient(...args),
}))

describe('DialogDeleteProject Component', () => {
    const mockSetIsOpen = jest.fn()

    const mockProject = {
        id: 'project-123',
        name: 'Test Project',
        user_id: 'user-456',
        created_at: '2024-01-01T00:00:00Z',
    }

    const defaultProps = {
        isOpen: true,
        setIsOpen: mockSetIsOpen,
        project: mockProject,
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
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        })
        mockPathname.mockReturnValue('/')
    })

    afterEach(() => {
        queryClient.clear()
    })

    describe('Rendering', () => {
        it('should render dialog when isOpen is true', () => {
            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
            expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument()
        })

        it('should not render dialog content when isOpen is false', () => {
            renderWithQueryClient(<DialogDeleteProject {...defaultProps} isOpen={false} />)

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        it('should display the project name in the description', () => {
            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            expect(screen.getByText(/Are you sure you want to delete "Test Project"/)).toBeInTheDocument()
        })

        it('should render Cancel and Delete Project buttons', () => {
            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Delete Project' })).toBeInTheDocument()
        })

        it('should display warning about deleting conversations', () => {
            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            expect(screen.getByText(/This action cannot be undone/)).toBeInTheDocument()
            expect(screen.getByText(/delete all conversations in this project/)).toBeInTheDocument()
        })
    })

    describe('User Interactions', () => {
        it('should call setIsOpen(false) when Cancel button is clicked', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Cancel' }))

            expect(mockSetIsOpen).toHaveBeenCalledWith(false)
        })

        it('should trigger delete mutation when Delete Project is clicked', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            })

            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete Project' }))

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalledWith(
                    `/api/projects/${mockProject.id}`,
                    expect.objectContaining({ method: 'DELETE' })
                )
            })
        })

        it('should show loading state while deleting', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                }), 100))
            )

            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete Project' }))

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Deleting...' })).toBeInTheDocument()
            })
        })

        it('should disable buttons while mutation is pending', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({
                    ok: true,
                    json: () => Promise.resolve({ success: true })
                }), 200))
            )

            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete Project' }))

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
                expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled()
            })
        })
    })

    describe('Navigation on Delete', () => {
        it('should redirect to home if currently viewing the deleted project', async () => {
            const user = userEvent.setup()
            mockPathname.mockReturnValue(`/p/${mockProject.id}`)
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            })

            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete Project' }))

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/')
            })
        })

        it('should not redirect if viewing a different page', async () => {
            const user = userEvent.setup()
            mockPathname.mockReturnValue('/other-page')
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            })

            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete Project' }))

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalled()
            })
            expect(mockPush).not.toHaveBeenCalled()
        })

        it('should redirect when on project subpage', async () => {
            const user = userEvent.setup()
            mockPathname.mockReturnValue(`/p/${mockProject.id}/settings`)
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            })

            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete Project' }))

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/')
            })
        })
    })

    describe('Error Handling', () => {
        it('should handle API error response', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ error: 'Project not found' }),
            })

            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete Project' }))

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalled()
            })
        })

        it('should handle network error', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockRejectedValue(new Error('Network error'))

            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete Project' }))

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalled()
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle project with empty name', () => {
            const projectWithEmptyName = { ...mockProject, name: '' }
            renderWithQueryClient(
                <DialogDeleteProject {...defaultProps} project={projectWithEmptyName} />
            )

            expect(screen.getByText(/Are you sure you want to delete ""/)).toBeInTheDocument()
        })

        it('should handle project with special characters in name', () => {
            const projectWithSpecialChars = { ...mockProject, name: 'Project <Test> & "Quotes"' }
            renderWithQueryClient(
                <DialogDeleteProject {...defaultProps} project={projectWithSpecialChars} />
            )

            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('should have proper dialog role', () => {
            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        it('should focus on dialog content when opened', () => {
            renderWithQueryClient(<DialogDeleteProject {...defaultProps} />)

            const dialog = screen.getByRole('dialog')
            expect(dialog).toBeInTheDocument()
        })
    })
})
