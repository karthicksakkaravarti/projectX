/**
 * Unit Tests: ScrollButton Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScrollButton } from '@/components/prompt-kit/scroll-button'

// Mock context context
// Mock context context
const mockScrollToBottom = jest.fn()
jest.mock('use-stick-to-bottom', () => ({
    useStickToBottomContext: () => ({
        isAtBottom: false, // Not at bottom, so button should be visible
        scrollToBottom: mockScrollToBottom,
    })
}))

import { useStickToBottomContext } from 'use-stick-to-bottom'

describe('ScrollButton Component', () => {
    it('should render and be visible when not at bottom', () => {
        render(<ScrollButton />)
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
    })

    it('should call scrollToBottom on click', async () => {
        const user = userEvent.setup()
        const { scrollToBottom } = useStickToBottomContext()

        render(<ScrollButton />)
        await user.click(screen.getByRole('button'))

        expect(mockScrollToBottom).toHaveBeenCalled()
    })
})
