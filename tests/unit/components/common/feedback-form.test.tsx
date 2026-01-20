/**
 * Unit Tests: FeedbackForm Component
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackForm } from '@/components/common/feedback-form'

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

jest.mock('@/lib/supabase/config', () => ({
    isSupabaseEnabled: true
}))

describe('FeedbackForm Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('should render form elements', () => {
        render(<FeedbackForm onClose={jest.fn()} authUserId="user-123" />)
        expect(screen.getByText('What would make ProjectX better for you?')).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Submit feedback' })).toBeInTheDocument()
    })

    it('should show error if not logged in', async () => {
        const user = userEvent.setup()
        const onClose = jest.fn()
        render(<FeedbackForm onClose={onClose} />)

        // Try to submit
        await user.click(screen.getByRole('button', { name: 'Submit feedback' }))

        // Toast should appear (mocked in setup usually, or we assume it calls toast)
        // Since we didn't mock toast specifically in this file but global setup might handle it or we rely on it being called.
        // But validation prevents submission mainly.
        // Actually the button is disabled if status is submitting or feedback is empty.
        // But the check `if (!authUserId)` happens on submit.

        // Wait, the button is disabled if `!feedback.trim()`. So we must type something first.
        await user.type(screen.getByRole('textbox'), 'Some feedback')
        await user.click(screen.getByRole('button', { name: 'Submit feedback' }))

        // Should not call supabase
        expect(mockFrom).not.toHaveBeenCalled()
    })

    it('should submit feedback successfully', async () => {
        const user = userEvent.setup()
        const onClose = jest.fn()
        mockInsert.mockResolvedValue({ error: null })

        render(<FeedbackForm onClose={onClose} authUserId="user-123" />)

        await user.type(screen.getByRole('textbox'), 'Great app!')
        await user.click(screen.getByRole('button', { name: 'Submit feedback' }))

        expect(mockFrom).toHaveBeenCalledWith('feedback')
        expect(mockInsert).toHaveBeenCalledWith({
            message: 'Great app!',
            user_id: 'user-123'
        })

        await waitFor(() => {
            expect(screen.getByText('Thank you for your time!')).toBeInTheDocument()
        })
    })

    it('should handle submission error', async () => {
        const user = userEvent.setup()
        const onClose = jest.fn()
        mockInsert.mockResolvedValue({ error: { message: 'Failed' } })

        render(<FeedbackForm onClose={onClose} authUserId="user-123" />)

        await user.type(screen.getByRole('textbox'), 'Bad app!')
        await user.click(screen.getByRole('button', { name: 'Submit feedback' }))

        await waitFor(() => {
            // Should not show success message
            expect(screen.queryByText('Thank you for your time!')).not.toBeInTheDocument()
        })
    })
})
