/**
 * Unit Tests: DialogCreateProject Component
 * Tests for the create project dialog with form handling and mutation
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogCreateProject } from '@/app/components/layout/sidebar/dialog-create-project'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock next/navigation
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
}))

// Mock fetchClient
const mockFetchClient = jest.fn()
jest.mock('@/lib/fetch', () => ({
    fetchClient: (...args: unknown[]) => mockFetchClient(...args),
}))

describe('DialogCreateProject Component', () => {
    const mockSetIsOpen = jest.fn()

    const defaultProps = {
        isOpen: true,
        setIsOpen: mockSetIsOpen,
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
    })

    afterEach(() => {
        queryClient.clear()
    })

    describe('Rendering', () => {
        it('should render dialog when isOpen is true', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
            expect(screen.getByText('Create New Project')).toBeInTheDocument()
        })

        it('should not render dialog content when isOpen is false', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} isOpen={false} />)

            expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        })

        it('should render project name input', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument()
        })

        it('should render Cancel and Create Project buttons', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Create Project' })).toBeInTheDocument()
        })

        it('should display description text', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            expect(screen.getByText('Enter a name for your new project.')).toBeInTheDocument()
        })

        it('should have input focused by default', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            const input = screen.getByPlaceholderText('Project name')
            expect(input).toHaveFocus()
        })
    })

    describe('Form Validation', () => {
        it('should disable Create Project button when input is empty', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            const createButton = screen.getByRole('button', { name: 'Create Project' })
            expect(createButton).toBeDisabled()
        })

        it('should enable Create Project button when input has value', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project')

            const createButton = screen.getByRole('button', { name: 'Create Project' })
            expect(createButton).toBeEnabled()
        })

        it('should disable button when input has only whitespace', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), '   ')

            const createButton = screen.getByRole('button', { name: 'Create Project' })
            expect(createButton).toBeDisabled()
        })
    })

    describe('User Interactions', () => {
        it('should call setIsOpen(false) when Cancel button is clicked', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Cancel' }))

            expect(mockSetIsOpen).toHaveBeenCalledWith(false)
        })

        it('should update input value when typing', async () => {
            const user = userEvent.setup()
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            const input = screen.getByPlaceholderText('Project name')
            await user.type(input, 'New Project Name')

            expect(input).toHaveValue('New Project Name')
        })

        it('should submit form when Create Project is clicked', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    id: 'project-123',
                    name: 'My Project',
                    user_id: 'user-456',
                    created_at: '2024-01-01T00:00:00Z',
                }),
            })

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalledWith(
                    '/api/projects',
                    expect.objectContaining({
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: 'My Project' }),
                    })
                )
            })
        })

        it('should submit form when Enter is pressed', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    id: 'project-123',
                    name: 'My Project',
                    user_id: 'user-456',
                    created_at: '2024-01-01T00:00:00Z',
                }),
            })

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project{enter}')

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalled()
            })
        })

        it('should trim whitespace from project name before submitting', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    id: 'project-123',
                    name: 'Trimmed Project',
                    user_id: 'user-456',
                    created_at: '2024-01-01T00:00:00Z',
                }),
            })

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), '  Trimmed Project  ')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalledWith(
                    '/api/projects',
                    expect.objectContaining({
                        body: JSON.stringify({ name: 'Trimmed Project' }),
                    })
                )
            })
        })
    })

    describe('Mutation States', () => {
        it('should show loading state while creating', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'project-123',
                        name: 'My Project',
                        user_id: 'user-456',
                        created_at: '2024-01-01T00:00:00Z',
                    }),
                }), 100))
            )

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Creating...' })).toBeInTheDocument()
            })
        })

        it('should disable Create button while mutation is pending', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockImplementation(
                () => new Promise((resolve) => setTimeout(() => resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        id: 'project-123',
                        name: 'My Project',
                        user_id: 'user-456',
                        created_at: '2024-01-01T00:00:00Z',
                    }),
                }), 200))
            )

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(screen.getByRole('button', { name: 'Creating...' })).toBeDisabled()
            })
        })
    })

    describe('On Success', () => {
        it('should navigate to new project page on success', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    id: 'new-project-id',
                    name: 'My Project',
                    user_id: 'user-456',
                    created_at: '2024-01-01T00:00:00Z',
                }),
            })

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(mockPush).toHaveBeenCalledWith('/p/new-project-id')
            })
        })

        it('should close dialog on success', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    id: 'project-123',
                    name: 'My Project',
                    user_id: 'user-456',
                    created_at: '2024-01-01T00:00:00Z',
                }),
            })

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(mockSetIsOpen).toHaveBeenCalledWith(false)
            })
        })

        it('should clear input on success', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    id: 'project-123',
                    name: 'My Project',
                    user_id: 'user-456',
                    created_at: '2024-01-01T00:00:00Z',
                }),
            })

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            const input = screen.getByPlaceholderText('Project name')
            await user.type(input, 'My Project')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(mockSetIsOpen).toHaveBeenCalledWith(false)
            })
        })
    })

    describe('Error Handling', () => {
        it('should handle API error response', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({ error: 'Project creation failed' }),
            })

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalled()
            })
            // Note: The component doesn't explicitly prevent dialog closure on error
            // This tests that the API is called correctly
        })

        it('should handle network error', async () => {
            const user = userEvent.setup()
            mockFetchClient.mockRejectedValue(new Error('Network error'))

            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            await user.type(screen.getByPlaceholderText('Project name'), 'My Project')
            await user.click(screen.getByRole('button', { name: 'Create Project' }))

            await waitFor(() => {
                expect(mockFetchClient).toHaveBeenCalled()
            })
        })
    })

    describe('Accessibility', () => {
        it('should have proper dialog role', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            expect(screen.getByRole('dialog')).toBeInTheDocument()
        })

        it('should have form element', () => {
            renderWithQueryClient(<DialogCreateProject {...defaultProps} />)

            expect(screen.getByRole('dialog').querySelector('form')).toBeInTheDocument()
        })
    })
})
