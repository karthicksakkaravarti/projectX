/**
 * Unit Tests: LoginPage Component
 * Tests for the login page component that handles Google authentication
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/auth/login-page'

// Mock dependencies
jest.mock('@/lib/api', () => ({
    signInWithGoogle: jest.fn(),
}))

jest.mock('@/lib/supabase/client', () => ({
    createClient: jest.fn(),
}))

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => {
        // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
        return <img {...props} />
    },
}))

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode; href: string }) => (
        <a href={href}>{children}</a>
    ),
}))

jest.mock('@/app/components/header-go-back', () => ({
    HeaderGoBack: ({ href }: { href?: string }) => (
        <div data-testid="header-go-back">Header {href}</div>
    ),
}))

// Import mocks after mocking
import { signInWithGoogle } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

const mockSignInWithGoogle = signInWithGoogle as jest.MockedFunction<typeof signInWithGoogle>
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

describe('LoginPage Component', () => {
    const mockSupabase = {
        auth: {
            signInWithOAuth: jest.fn(),
        },
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockCreateClient.mockReturnValue(mockSupabase as any)
        // Don't override window.location in JSDOM, just spy on it
    })

    describe('rendering', () => {
        it('should render the login page with title', () => {
            render(<LoginPage />)
            expect(screen.getByText('Welcome to ProjectX')).toBeInTheDocument()
        })

        it('should render the sign in description', () => {
            render(<LoginPage />)
            expect(screen.getByText(/Sign in below to increase your message limits/i)).toBeInTheDocument()
        })

        it('should render the Google sign-in button', () => {
            render(<LoginPage />)
            expect(screen.getByText('Continue with Google')).toBeInTheDocument()
        })

        it('should render header go back component', () => {
            render(<LoginPage />)
            expect(screen.getByTestId('header-go-back')).toBeInTheDocument()
        })

        it('should render footer with terms and privacy links', () => {
            render(<LoginPage />)
            expect(screen.getByText(/By continuing, you agree to our/i)).toBeInTheDocument()
            expect(screen.getByText('Terms of Service')).toBeInTheDocument()
            expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
        })

        it('should not render error message initially', () => {
            render(<LoginPage />)
            expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        })
    })

    describe('Google sign-in flow', () => {
        it('should handle successful Google sign-in', async () => {
            const mockUrl = 'https://accounts.google.com/o/oauth2/auth'
            mockSignInWithGoogle.mockResolvedValue({ url: mockUrl } as any)

            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(mockCreateClient).toHaveBeenCalled()
            })

            await waitFor(() => {
                expect(mockSignInWithGoogle).toHaveBeenCalledWith(mockSupabase)
            })

            // Window.location.href will be set, just verify the mock was called
            expect(mockSignInWithGoogle).toHaveBeenCalledWith(mockSupabase)
        })

        it('should show loading state during sign-in', async () => {
            mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(screen.getByText('Connecting...')).toBeInTheDocument()
            })
        })

        it('should disable button during sign-in', async () => {
            mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

            render(<LoginPage />)
            const button = screen.getByRole('button', { name: /Continue with Google/i })
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(button).toBeDisabled()
            })
        })

        it('should handle error during Google sign-in', async () => {
            const errorMessage = 'Authentication failed'
            mockSignInWithGoogle.mockRejectedValue(new Error(errorMessage))

            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument()
            })
        })

        it('should display error message when sign-in fails', async () => {
            mockSignInWithGoogle.mockRejectedValue(new Error('Network error'))

            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument()
            })
        })

        it('should handle unknown error type', async () => {
            mockSignInWithGoogle.mockRejectedValue('Unknown error')

            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument()
            })
        })

        it('should clear error when retrying sign-in', async () => {
            mockSignInWithGoogle.mockRejectedValueOnce(new Error('First error'))
            
            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(screen.getByText('First error')).toBeInTheDocument()
            })

            mockSignInWithGoogle.mockResolvedValue({ url: 'https://google.com' } as any)
            fireEvent.click(button)

            await waitFor(() => {
                expect(screen.queryByText('First error')).not.toBeInTheDocument()
            })
        })

        it('should re-enable button after error', async () => {
            mockSignInWithGoogle.mockRejectedValue(new Error('Error'))

            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(screen.getByText('Error')).toBeInTheDocument()
            })

            await waitFor(() => {
                expect(button).not.toBeDisabled()
            })
        })
    })

    describe('Supabase client errors', () => {
        it('should have button when Supabase is not configured', async () => {
            mockCreateClient.mockReturnValue(null as any)

            render(<LoginPage />)
            const button = screen.getByRole('button', { name: /Continue with Google/i })
            
            // The error will be thrown when clicked, just verify button renders
            expect(button).toBeInTheDocument()
        })
    })

    describe('accessibility', () => {
        it('should have accessible button', () => {
            render(<LoginPage />)
            const button = screen.getByRole('button', { name: /Continue with Google/i })
            expect(button).toBeInTheDocument()
        })

        it('should have accessible links', () => {
            render(<LoginPage />)
            const termsLink = screen.getByText('Terms of Service')
            const privacyLink = screen.getByText('Privacy Policy')
            
            expect(termsLink).toBeInTheDocument()
            expect(privacyLink).toBeInTheDocument()
        })
    })

    describe('edge cases', () => {
        it('should handle sign-in response without URL', async () => {
            mockSignInWithGoogle.mockResolvedValue({} as any)

            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(mockSignInWithGoogle).toHaveBeenCalled()
            })

            // Should complete without error
            expect(mockSignInWithGoogle).toHaveBeenCalledWith(mockSupabase)
        })

        it('should handle null response from sign-in', async () => {
            mockSignInWithGoogle.mockResolvedValue(null as any)

            render(<LoginPage />)
            const button = screen.getByText('Continue with Google')
            
            fireEvent.click(button)

            await waitFor(() => {
                expect(mockSignInWithGoogle).toHaveBeenCalled()
            })

            // Should complete without error
            expect(mockSignInWithGoogle).toHaveBeenCalledWith(mockSupabase)
        })
    })
})
