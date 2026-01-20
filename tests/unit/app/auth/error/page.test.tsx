/**
 * Unit Tests: Auth Error Page Component
 * Tests for the authentication error page
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AuthErrorPage from '@/app/auth/error/page'

// Mock dependencies
jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

jest.mock('next/navigation', () => ({
    useSearchParams: jest.fn(),
}))

jest.mock('@phosphor-icons/react', () => ({
    ArrowLeft: () => <div data-testid="arrow-left-icon">ArrowLeft</div>,
}))

// Import mocks after mocking
import { useSearchParams } from 'next/navigation'

const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>

describe('AuthErrorPage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('rendering', () => {
        it('should render the error page title', async () => {
            mockUseSearchParams.mockReturnValue({
                get: jest.fn().mockReturnValue(null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                expect(screen.getByText('Authentication Error')).toBeInTheDocument()
            })
        })

        it('should render back to chat link', async () => {
            mockUseSearchParams.mockReturnValue({
                get: jest.fn().mockReturnValue(null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                expect(screen.getByText('Back to Chat')).toBeInTheDocument()
            })
        })

        it('should render Try Again button', async () => {
            mockUseSearchParams.mockReturnValue({
                get: jest.fn().mockReturnValue(null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                expect(screen.getByText('Try Again')).toBeInTheDocument()
            })
        })
    })

    describe('error messages', () => {
        it('should display custom error message from URL params', async () => {
            const customError = 'Invalid authentication code'
            mockUseSearchParams.mockReturnValue({
                get: jest.fn((key) => key === 'message' ? customError : null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                expect(screen.getByText(customError)).toBeInTheDocument()
            })
        })

        it('should display default error message when no message in params', async () => {
            mockUseSearchParams.mockReturnValue({
                get: jest.fn().mockReturnValue(null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                expect(screen.getByText('An error occurred during authentication.')).toBeInTheDocument()
            })
        })

        it('should display Supabase not enabled error', async () => {
            const errorMsg = 'Supabase is not enabled in this deployment.'
            mockUseSearchParams.mockReturnValue({
                get: jest.fn((key) => key === 'message' ? errorMsg : null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                expect(screen.getByText(errorMsg)).toBeInTheDocument()
            })
        })

        it('should display missing authentication code error', async () => {
            const errorMsg = 'Missing authentication code'
            mockUseSearchParams.mockReturnValue({
                get: jest.fn((key) => key === 'message' ? errorMsg : null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                expect(screen.getByText(errorMsg)).toBeInTheDocument()
            })
        })
    })

    describe('navigation links', () => {
        it('should have link to auth page for retry', async () => {
            mockUseSearchParams.mockReturnValue({
                get: jest.fn().mockReturnValue(null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                const tryAgainLink = screen.getByText('Try Again').closest('a')
                expect(tryAgainLink).toHaveAttribute('href', '/auth')
            })
        })

        it('should have link to home page', async () => {
            mockUseSearchParams.mockReturnValue({
                get: jest.fn().mockReturnValue(null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                const backLink = screen.getByText('Back to Chat').closest('a')
                expect(backLink).toHaveAttribute('href', '/')
            })
        })
    })

    describe('accessibility', () => {
        it('should have accessible links', async () => {
            mockUseSearchParams.mockReturnValue({
                get: jest.fn().mockReturnValue(null),
            } as any)

            render(<AuthErrorPage />)
            
            await waitFor(() => {
                const links = screen.getAllByRole('link')
                expect(links.length).toBeGreaterThan(0)
            })
        })
    })
})
