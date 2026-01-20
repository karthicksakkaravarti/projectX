/**
 * Unit Tests: ProModelDialog Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProModelDialog } from '@/components/common/model-selector/pro-dialog'

// Mock Dialog components
jest.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/drawer', () => ({
    Drawer: ({ children, open }: any) => open ? <div>{children}</div> : null,
    DrawerContent: ({ children }: any) => <div>{children}</div>,
    DrawerHeader: ({ children }: any) => <div>{children}</div>,
    DrawerTitle: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}))

// Mock user store
jest.mock('@/lib/user-store/provider', () => ({
    useUser: () => ({ user: { id: 'user-1' } })
}))

// Mock Supabase
const mockInsert = jest.fn().mockResolvedValue({ error: null })
const mockFrom = jest.fn(() => ({
    insert: mockInsert
}))
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => Promise.resolve({
        from: mockFrom
    })
}))

jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => false // Default to desktop (Dialog)
}))

// Mock tanstack query
const mockMutate = jest.fn()
jest.mock('@tanstack/react-query', () => {
    return {
        useMutation: ({ mutationFn, onSuccess }: any) => {
            return {
                mutate: () => {
                    mockMutate()
                    mutationFn().then(() => onSuccess?.())
                },
                isPending: false,
                isSuccess: false,
            }
        }
    }
})

describe('ProModelDialog Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

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
        })
    })
})
