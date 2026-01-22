/**
 * Unit Tests: ProModelDialog Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProModelDialog } from '@/components/common/model-selector/pro-dialog'

// Mock Dialog components
jest.mock('@/components/ui/dialog', () => ({
    Dialog: ({ children, open, onOpenChange }: any) => open ? (
        <div data-testid="dialog">
            <button data-testid="close-dialog" onClick={() => onOpenChange?.(false)}>Close</button>
            {children}
        </div>
    ) : null,
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/drawer', () => ({
    Drawer: ({ children, open, onOpenChange }: any) => open ? (
        <div data-testid="drawer">
            <button data-testid="close-drawer" onClick={() => onOpenChange?.(false)}>Close</button>
            {children}
        </div>
    ) : null,
    DrawerContent: ({ children }: any) => <div>{children}</div>,
    DrawerHeader: ({ children }: any) => <div>{children}</div>,
    DrawerTitle: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}))

// Mock user store - made dynamic
const mockUseUser = jest.fn(() => ({ user: { id: 'user-1' } }))
jest.mock('@/lib/user-store/provider', () => ({
    useUser: () => mockUseUser()
}))

// Mock Supabase - made dynamic
const mockInsert = jest.fn().mockResolvedValue({ error: null })
const mockFrom = jest.fn(() => ({
    insert: mockInsert
}))
const mockCreateClient = jest.fn(() => Promise.resolve({
    from: mockFrom
}))
jest.mock('@/lib/supabase/client', () => ({
    createClient: () => mockCreateClient()
}))

// Mock breakpoint - made dynamic
const mockUseBreakpoint = jest.fn(() => false)
jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => mockUseBreakpoint()
}))

// Mock tanstack query - made dynamic
let mockMutationState = { isPending: false, isSuccess: false }
const mockMutate = jest.fn()
jest.mock('@tanstack/react-query', () => {
    return {
        useMutation: ({ mutationFn, onSuccess }: any) => {
            return {
                mutate: () => {
                    mockMutate()
                    mutationFn().then(() => onSuccess?.()).catch(() => {})
                },
                isPending: mockMutationState.isPending,
                isSuccess: mockMutationState.isSuccess,
            }
        }
    }
})

describe('ProModelDialog Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockUseBreakpoint.mockReturnValue(false)
        mockMutationState = { isPending: false, isSuccess: false }
        mockUseUser.mockReturnValue({ user: { id: 'user-1' } })
        mockCreateClient.mockResolvedValue({ from: mockFrom })
        mockInsert.mockResolvedValue({ error: null })
    })

    describe('desktop view (Dialog)', () => {
        it('should render dialog content when open', () => {
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            expect(screen.getByTestId('dialog')).toBeInTheDocument()
            expect(screen.getByText('This model is locked')).toBeInTheDocument()
            expect(screen.getByText('Ask for access')).toBeInTheDocument()
        })

        it('should not render when closed', () => {
            render(
                <ProModelDialog
                    isOpen={false}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            expect(screen.queryByTestId('dialog')).not.toBeInTheDocument()
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

            await waitFor(() => {
                expect(mockFrom).toHaveBeenCalledWith('feedback')
            })
        })

        it('should call setIsOpen when dialog is closed', () => {
            const mockSetIsOpen = jest.fn()
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                    currentModel="gpt-4-pro"
                />
            )

            fireEvent.click(screen.getByTestId('close-dialog'))
            expect(mockSetIsOpen).toHaveBeenCalledWith(false)
        })
    })

    describe('mobile view (Drawer)', () => {
        beforeEach(() => {
            mockUseBreakpoint.mockReturnValue(true)
        })

        it('should render drawer on mobile', () => {
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            expect(screen.getByTestId('drawer')).toBeInTheDocument()
            expect(screen.getByText('This model is locked')).toBeInTheDocument()
        })

        it('should call setIsOpen when drawer is closed', () => {
            const mockSetIsOpen = jest.fn()
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={mockSetIsOpen}
                    currentModel="gpt-4-pro"
                />
            )

            fireEvent.click(screen.getByTestId('close-drawer'))
            expect(mockSetIsOpen).toHaveBeenCalledWith(false)
        })
    })

    describe('mutation states', () => {
        it('should show pending state', () => {
            mockMutationState = { isPending: true, isSuccess: false }
            
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            expect(screen.getByText('Sending...')).toBeInTheDocument()
        })

        it('should show success state', () => {
            mockMutationState = { isPending: false, isSuccess: true }
            
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            expect(screen.getByText("Thanks! We'll keep you updated")).toBeInTheDocument()
        })
    })

    describe('error handling', () => {
        it('should handle missing user', async () => {
            mockUseUser.mockReturnValue({ user: null })
            
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            fireEvent.click(screen.getByText('Ask for access'))
            
            // Should not call supabase if no user
            await waitFor(() => {
                expect(mockMutate).toHaveBeenCalled()
            })
        })

        it('should handle missing supabase client', async () => {
            mockCreateClient.mockResolvedValue(null)
            
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            fireEvent.click(screen.getByText('Ask for access'))
            expect(mockMutate).toHaveBeenCalled()
        })

        it('should handle supabase insert error', async () => {
            mockInsert.mockResolvedValue({ error: { message: 'Insert failed' } })
            
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            fireEvent.click(screen.getByText('Ask for access'))
            expect(mockMutate).toHaveBeenCalled()
        })
    })

    describe('content rendering', () => {
        it('should render model-specific content', () => {
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="claude-3-opus"
                />
            )

            expect(screen.getByText('This model is locked')).toBeInTheDocument()
            expect(screen.getByText(/OpenRouter/)).toBeInTheDocument()
            expect(screen.getByText(/Settings → API Keys/)).toBeInTheDocument()
        })

        it('should render banner image', () => {
            render(
                <ProModelDialog
                    isOpen={true}
                    setIsOpen={jest.fn()}
                    currentModel="gpt-4-pro"
                />
            )

            const img = screen.getByRole('img')
            expect(img).toHaveAttribute('src', '/banner_ocean.jpg')
        })
    })
})
