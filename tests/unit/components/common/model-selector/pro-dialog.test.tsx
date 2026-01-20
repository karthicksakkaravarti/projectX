/**
 * Unit Tests: ProModelDialog Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProModelDialog } from '@/components/common/model-selector/pro-dialog'

// Mock user store
jest.mock('@/lib/user-store/provider', () => ({
    useUser: () => ({ user: { id: 'user-1' } })
}))

// Mock Supabase
const mockInsert = jest.fn()
const mockFrom = jest.fn(() => ({
    insert: mockInsert
}))
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => ({
        from: mockFrom
    })
}))

// Mock Drawer for mobile view handling if needed, or rely on desktop dialog
// The component switches based on useBreakpoint
jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => false // Default to desktop (Dialog)
}))

// Mock tanstack query
const mockMutate = jest.fn()
jest.mock('@tanstack/react-query', () => {
    const original = jest.requireActual('@tanstack/react-query')
    return {
        ...original,
        useMutation: ({ mutationFn }: any) => {
            return {
                mutate: () => {
                    mockMutate()
                    // Manually trigger the fn for testing logic validation if needed
                    return mutationFn()
                },
                isPending: false,
                isSuccess: false, // We can toggle this via mock implementation if we want to test success state
            }
        }
    }
})

describe('ProModelDialog Component', () => {
    it('should render dialog content when open', () => {
        render(
            <ProModelDialog
                isOpen={true}
                setIsOpen={jest.fn()}
                currentModel="gpt-4-pro"
            />
        )

        expect(screen.getByText('This model is locked')).toBeInTheDocument()
        expect(screen.getByText('Ask for access')).toBeInTheDocument()
    })

    it('should trigger mutation on click', async () => {
        render(
            <ProModelDialog
                isOpen={true}
                setIsOpen={jest.fn()}
                currentModel="gpt-4-pro"
            />
        )

        fireEvent.click(screen.getByText('Ask for access'))
        expect(mockMutate).toHaveBeenCalled()

        // Since our mockMutate calls mutationFn which calls supabase
        await waitFor(() => {
            expect(mockFrom).toHaveBeenCalledWith('feedback')
            expect(mockInsert).toHaveBeenCalledWith({
                message: 'I want access to gpt-4-pro',
                user_id: 'user-1'
            })
        })
    })
})
