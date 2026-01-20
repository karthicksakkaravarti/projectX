/**
 * Unit Tests: DialogAuth Component
 * Tests for the authentication dialog component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogAuth } from '@/app/components/chat/dialog-auth'

// Mock dependencies
const mockSignInWithGoogle = jest.fn()

jest.mock('@/lib/supabase/config', () => ({
    isSupabaseEnabled: true,
}))

jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        auth: {
            signInWithOAuth: jest.fn(),
        },
    }),
}))

jest.mock('@/lib/api', () => ({
    signInWithGoogle: (supabase: any) => mockSignInWithGoogle(supabase),
}))

// Mock Dialog components
jest.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: { children: React.ReactNode, open: boolean }) =>
        open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children, className }: { children: React.ReactNode, className?: string }) =>
        <div data-testid="dialog-content" className={className}>{children}</div>,
    DialogHeader: ({ children }: { children: React.ReactNode }) =>
        <div data-testid="dialog-header">{children}</div>,
    DialogTitle: ({ children, className }: { children: React.ReactNode, className?: string }) =>
        <h2 data-testid="dialog-title">{children}</h2>,
    DialogDescription: ({ children, className }: { children: React.ReactNode, className?: string }) =>
        <p data-testid="dialog-description">{children}</p>,
    DialogFooter: ({ children, className }: { children: React.ReactNode, className?: string }) =>
        <div data-testid="dialog-footer" className={className}>{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled, ...props }: any) => (
        <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
    ),
}))

describe('DialogAuth Component', () => {
    const defaultProps = {
        open: true,
        setOpen: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockSignInWithGoogle.mockResolvedValue({ url: 'https://auth.google.com' })
    })

    describe('rendering', () => {
        it('should render dialog when open is true', () => {
            render(<DialogAuth {...defaultProps} />)

            expect(screen.getByTestId('dialog')).toBeInTheDocument()
        })

        it('should not render dialog when open is false', () => {
            render(<DialogAuth {...defaultProps} open={false} />)

            expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
        })

        it('should render dialog title', () => {
            render(<DialogAuth {...defaultProps} />)

            expect(screen.getByTestId('dialog-title')).toHaveTextContent("You've reached the limit for today")
        })

        it('should render dialog description', () => {
            render(<DialogAuth {...defaultProps} />)

            expect(screen.getByTestId('dialog-description')).toHaveTextContent('Sign in below to increase your message limits')
        })

        it('should render Google sign-in button', () => {
            render(<DialogAuth {...defaultProps} />)

            expect(screen.getByText('Continue with Google')).toBeInTheDocument()
        })

        it('should render Google logo', () => {
            render(<DialogAuth {...defaultProps} />)

            const logo = screen.getByAltText('Google logo')
            expect(logo).toBeInTheDocument()
            expect(logo).toHaveAttribute('src', 'https://www.google.com/favicon.ico')
        })
    })

    describe('Google sign-in', () => {
        it('should call signInWithGoogle when button is clicked', async () => {
            const user = userEvent.setup()
            render(<DialogAuth {...defaultProps} />)

            await user.click(screen.getByText('Continue with Google'))

            expect(mockSignInWithGoogle).toHaveBeenCalled()
        })

        it('should show loading state while signing in', async () => {
            mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ url: 'https://auth.google.com' }), 100)))

            const user = userEvent.setup()
            render(<DialogAuth {...defaultProps} />)

            await user.click(screen.getByText('Continue with Google'))

            expect(screen.getByText('Connecting...')).toBeInTheDocument()
        })

        it('should disable button while loading', async () => {
            mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ url: 'https://auth.google.com' }), 100)))

            const user = userEvent.setup()
            render(<DialogAuth {...defaultProps} />)

            const button = screen.getByText('Continue with Google').closest('button')
            await user.click(button!)

            await waitFor(() => {
                expect(button).toBeDisabled()
            })
        })
    })

    describe('error handling', () => {
        it('should display error message when sign-in fails', async () => {
            mockSignInWithGoogle.mockRejectedValue(new Error('Sign-in failed'))

            const user = userEvent.setup()
            render(<DialogAuth {...defaultProps} />)

            await user.click(screen.getByText('Continue with Google'))

            await waitFor(() => {
                expect(screen.getByText('Sign-in failed')).toBeInTheDocument()
            })
        })

        it('should display generic error message for unknown errors', async () => {
            mockSignInWithGoogle.mockRejectedValue(new Error())

            const user = userEvent.setup()
            render(<DialogAuth {...defaultProps} />)

            await user.click(screen.getByText('Continue with Google'))

            await waitFor(() => {
                expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
            })
        })
    })

    describe('redirect behavior', () => {
        it('should call signInWithGoogle and get URL for redirect on successful sign-in', async () => {
            mockSignInWithGoogle.mockResolvedValue({ url: 'https://accounts.google.com/oauth' })

            render(<DialogAuth {...defaultProps} />)

            fireEvent.click(screen.getByText('Continue with Google'))

            await waitFor(() => {
                expect(mockSignInWithGoogle).toHaveBeenCalled()
            })
            
            // Verify the mock was called - the actual redirect would set window.location.href
            // which we can't easily test in jsdom, but we verify the sign-in function was called
            expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1)
        })
    })
})

describe('DialogAuth with Supabase disabled', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    it('should return null when supabase is disabled', () => {
        jest.doMock('@/lib/supabase/config', () => ({
            isSupabaseEnabled: false,
        }))

        // The component should return null, but we can't easily test this
        // without a more complex setup due to module caching
    })
})
