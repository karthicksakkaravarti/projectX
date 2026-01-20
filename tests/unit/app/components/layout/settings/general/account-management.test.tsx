import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AccountManagement } from '@/app/components/layout/settings/general/account-management'
import { useRouter } from 'next/navigation'
import { clearAllIndexedDBStores } from '@/lib/chat-store/persist'
import { toast } from '@/components/ui/toast'

// Mock dependencies
const mockSignOut = jest.fn()
const mockResetChats = jest.fn()
const mockResetMessages = jest.fn()
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
}))

jest.mock('@/lib/user-store/provider', () => ({
    useUser: () => ({
        signOut: mockSignOut,
    }),
}))

jest.mock('@/lib/chat-store/chats/provider', () => ({
    useChats: () => ({
        resetChats: mockResetChats,
    }),
}))

jest.mock('@/lib/chat-store/messages/provider', () => ({
    useMessages: () => ({
        resetMessages: mockResetMessages,
    }),
}))

jest.mock('@/lib/chat-store/persist', () => ({
    clearAllIndexedDBStores: jest.fn(),
}))

jest.mock('@/components/ui/toast', () => ({
    toast: jest.fn(),
}))

describe('AccountManagement Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('renders account management section correctly', () => {
        render(<AccountManagement />)

        expect(screen.getByText('Account')).toBeInTheDocument()
        expect(screen.getByText('Log out on this device')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })

    test('handles sign out successfully', async () => {
        render(<AccountManagement />)

        const signOutButton = screen.getByRole('button', { name: /sign out/i })
        fireEvent.click(signOutButton)

        await waitFor(() => {
            expect(mockResetMessages).toHaveBeenCalled()
            expect(mockResetChats).toHaveBeenCalled()
            expect(mockSignOut).toHaveBeenCalled()
            expect(clearAllIndexedDBStores).toHaveBeenCalled()
            expect(mockPush).toHaveBeenCalledWith('/')
        })
    })

    test('handles sign out failure', async () => {
        const error = new Error('Sign out failed')
        mockSignOut.mockRejectedValueOnce(error)

        // Mock console.error to avoid cluttering test output
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

        render(<AccountManagement />)

        const signOutButton = screen.getByRole('button', { name: /sign out/i })
        fireEvent.click(signOutButton)

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled()
            expect(consoleSpy).toHaveBeenCalledWith('Sign out failed:', error)
            expect(toast).toHaveBeenCalledWith({
                title: 'Failed to sign out',
                status: 'error',
            })
            // Should not redirect on failure
            expect(mockPush).not.toHaveBeenCalled()
        })

        consoleSpy.mockRestore()
    })
})
