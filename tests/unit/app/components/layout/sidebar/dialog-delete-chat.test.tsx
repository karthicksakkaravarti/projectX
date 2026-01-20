/**
 * Unit Tests: DialogDeleteChat Component
 * Tests for the delete chat confirmation dialog
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DialogDeleteChat } from '@/app/components/layout/sidebar/dialog-delete-chat'

describe('DialogDeleteChat Component', () => {
    const mockSetIsOpen = jest.fn()
    const mockOnConfirmDelete = jest.fn().mockResolvedValue(undefined)

    const defaultProps = {
        isOpen: true,
        setIsOpen: mockSetIsOpen,
        chatTitle: 'Test Chat',
        onConfirmDelete: mockOnConfirmDelete,
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render dialog when isOpen is true', () => {
            render(<DialogDeleteChat {...defaultProps} />)

            expect(screen.getByRole('alertdialog')).toBeInTheDocument()
            expect(screen.getByText('Delete chat?')).toBeInTheDocument()
        })

        it('should not render dialog content when isOpen is false', () => {
            render(<DialogDeleteChat {...defaultProps} isOpen={false} />)

            expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
        })

        it('should display the chat title in the description', () => {
            render(<DialogDeleteChat {...defaultProps} chatTitle="My Important Chat" />)

            expect(screen.getByText(/This will delete "My Important Chat"/)).toBeInTheDocument()
        })

        it('should render Cancel and Delete buttons', () => {
            render(<DialogDeleteChat {...defaultProps} />)

            expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
        })

        it('should render dialog header correctly', () => {
            render(<DialogDeleteChat {...defaultProps} />)

            expect(screen.getByText('Delete chat?')).toBeInTheDocument()
        })
    })

    describe('User Interactions', () => {
        it('should call setIsOpen(false) when Cancel button is clicked', async () => {
            const user = userEvent.setup()
            render(<DialogDeleteChat {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Cancel' }))

            expect(mockSetIsOpen).toHaveBeenCalledWith(false)
        })

        it('should call setIsOpen(false) and onConfirmDelete when Delete button is clicked', async () => {
            const user = userEvent.setup()
            render(<DialogDeleteChat {...defaultProps} />)

            await user.click(screen.getByRole('button', { name: 'Delete' }))

            await waitFor(() => {
                expect(mockSetIsOpen).toHaveBeenCalledWith(false)
            })
            expect(mockOnConfirmDelete).toHaveBeenCalled()
        })

        it('should handle async onConfirmDelete', async () => {
            const user = userEvent.setup()
            const asyncDelete = jest.fn().mockImplementation(() =>
                new Promise(resolve => setTimeout(resolve, 100))
            )

            render(<DialogDeleteChat {...defaultProps} onConfirmDelete={asyncDelete} />)

            await user.click(screen.getByRole('button', { name: 'Delete' }))

            await waitFor(() => {
                expect(asyncDelete).toHaveBeenCalled()
            })
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty chat title', () => {
            render(<DialogDeleteChat {...defaultProps} chatTitle="" />)

            expect(screen.getByText(/This will delete ""/)).toBeInTheDocument()
        })

        it('should handle special characters in chat title', () => {
            render(<DialogDeleteChat {...defaultProps} chatTitle='Chat with "quotes" & <symbols>' />)

            expect(screen.getByText(/Chat with/)).toBeInTheDocument()
        })

        it('should handle long chat titles', () => {
            const longTitle = 'A'.repeat(200)
            render(<DialogDeleteChat {...defaultProps} chatTitle={longTitle} />)

            expect(screen.getByText(new RegExp(longTitle))).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('should have proper dialog role', () => {
            render(<DialogDeleteChat {...defaultProps} />)

            expect(screen.getByRole('alertdialog')).toBeInTheDocument()
        })

        it('should have accessible dialog title', () => {
            render(<DialogDeleteChat {...defaultProps} />)

            const dialog = screen.getByRole('alertdialog')
            expect(dialog).toHaveAttribute('aria-labelledby')
        })

        it('should have accessible dialog description', () => {
            render(<DialogDeleteChat {...defaultProps} />)

            const dialog = screen.getByRole('alertdialog')
            expect(dialog).toHaveAttribute('aria-describedby')
        })
    })
})
