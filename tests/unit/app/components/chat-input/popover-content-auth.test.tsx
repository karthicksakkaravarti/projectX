/**
 * Unit Tests: PopoverContentAuth Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PopoverContentAuth } from '@/app/components/chat-input/popover-content-auth'
import { signInWithGoogle } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'

// Mock dependencies
const mockSignInWithGoogle = jest.fn()
let mockIsSupabaseEnabled = true
let mockCreateClient = jest.fn().mockReturnValue({
    auth: {
        signInWithOAuth: jest.fn(),
    },
})

jest.mock('@/lib/supabase/config', () => ({
    get isSupabaseEnabled() {
        return mockIsSupabaseEnabled
    },
}))

jest.mock('@/lib/supabase/client', () => ({
    createClient: () => mockCreateClient(),
}))

jest.mock('@/lib/api', () => ({
    signInWithGoogle: (supabase: any) => mockSignInWithGoogle(supabase),
}))

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled }: any) => (
        <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
}))

jest.mock('@/components/ui/popover', () => ({
    PopoverContent: ({ children, className }: any) => (
        <div data-testid="popover-content" className={className}>{children}</div>
    ),
}))

describe('PopoverContentAuth Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockIsSupabaseEnabled = true
        mockCreateClient = jest.fn().mockReturnValue({
            auth: {
                signInWithOAuth: jest.fn(),
            },
        })
        mockSignInWithGoogle.mockResolvedValue({ url: 'https://auth.google.com' })
    })

    it('should render correctly', () => {
        render(<PopoverContentAuth />)
        expect(screen.getByText(/Login to try more features for free/i)).toBeInTheDocument()
        expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument()
    })

    it('should call signInWithGoogle when button is clicked', async () => {
        render(<PopoverContentAuth />)
        fireEvent.click(screen.getByText('Continue with Google'))

        expect(screen.getByText('Connecting...')).toBeInTheDocument()
        expect(mockSignInWithGoogle).toHaveBeenCalled()
    })

    it('should display error message on sign-in failure', async () => {
        mockSignInWithGoogle.mockRejectedValue(new Error('Sign-in failed'))

        render(<PopoverContentAuth />)
        fireEvent.click(screen.getByText('Continue with Google'))

        await waitFor(() => {
            expect(screen.getByText('Sign-in failed')).toBeInTheDocument()
        })
    })

    it('should return null when Supabase is not enabled', () => {
        mockIsSupabaseEnabled = false
        const { container } = render(<PopoverContentAuth />)
        expect(container.firstChild).toBeNull()
    })

    it('should handle sign-in with URL response', async () => {
        mockSignInWithGoogle.mockResolvedValue({ url: 'https://auth.google.com/callback' })

        render(<PopoverContentAuth />)
        fireEvent.click(screen.getByText('Continue with Google'))

        // Verify signInWithGoogle was called
        await waitFor(() => {
            expect(mockSignInWithGoogle).toHaveBeenCalled()
        })
    })

    it('should handle sign-in without URL', async () => {
        mockSignInWithGoogle.mockResolvedValue({ url: null })

        render(<PopoverContentAuth />)
        fireEvent.click(screen.getByText('Continue with Google'))

        await waitFor(() => {
            expect(mockSignInWithGoogle).toHaveBeenCalled()
        })
        // No error should be displayed
        expect(screen.queryByText('Sign-in failed')).not.toBeInTheDocument()
    })

    it('should show default error message when error has no message', async () => {
        mockSignInWithGoogle.mockRejectedValue({})

        render(<PopoverContentAuth />)
        fireEvent.click(screen.getByText('Continue with Google'))

        await waitFor(() => {
            expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument()
        })
    })
})
