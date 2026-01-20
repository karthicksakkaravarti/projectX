/**
 * Unit Tests: QuoteButton Component
 * Tests for the floating quote button
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuoteButton } from '@/app/components/chat/quote-button'

// Mock dependencies
jest.mock('@/components/motion-primitives/useClickOutside', () => ({
    __esModule: true,
    default: (ref: any, handler: any) => {
        // Mock implementation for click outside if needed, 
        // or just checking if it's called
    }
}))

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, className }: any) => (
        <button onClick={onClick} className={className} data-testid="quote-btn">
            {children}
        </button>
    ),
}))

jest.mock('lucide-react', () => ({
    Quote: ({ className }: { className?: string }) => (
        <span data-testid="quote-icon" className={className}>"</span>
    ),
}))

describe('QuoteButton Component', () => {
    const defaultProps = {
        mousePosition: { x: 100, y: 100 },
        onQuote: jest.fn(),
        messageContainerRef: { current: document.createElement('div') },
        onDismiss: jest.fn(),
    }

    beforeEach(() => {
        // Mock getBoundingClientRect
        jest.spyOn(defaultProps.messageContainerRef.current!, 'getBoundingClientRect').mockReturnValue({
            top: 50,
            left: 50,
            right: 200,
            bottom: 200,
            width: 150,
            height: 150,
            x: 50,
            y: 50,
            toJSON: () => { }
        })
        jest.clearAllMocks()
    })

    describe('rendering', () => {
        it('should render the quote button', () => {
            render(<QuoteButton {...defaultProps} />)

            expect(screen.getByTestId('quote-btn')).toBeInTheDocument()
        })

        it('should render the quote icon', () => {
            render(<QuoteButton {...defaultProps} />)

            expect(screen.getByTestId('quote-icon')).toBeInTheDocument()
        })
    })

    describe('positioning', () => {
        it('should calculate position correctly relative to container', () => {
            render(<QuoteButton {...defaultProps} />)

            const buttonContainer = screen.getByTestId('quote-btn').parentElement

            // Expected calculation:
            // top = mouse.y (100) - container.top (50) - buttonHeight (60) = -10
            // left = mouse.x (100) - container.left (50) = 50

            expect(buttonContainer).toHaveStyle({
                top: '-10px',
                left: '50px',
                transform: 'translateX(-50%)'
            })
        })

        it('should default to 0,0 if container ref is null', () => {
            const propsWithoutRef = { ...defaultProps, messageContainerRef: { current: null } }
            render(<QuoteButton {...propsWithoutRef} />)

            const buttonContainer = screen.getByTestId('quote-btn').parentElement

            expect(buttonContainer).toHaveStyle({
                top: '0px',
                left: '0px'
            })
        })
    })

    describe('interactions', () => {
        it('should call onQuote when clicked', async () => {
            const user = userEvent.setup()
            render(<QuoteButton {...defaultProps} />)

            await user.click(screen.getByTestId('quote-btn'))

            expect(defaultProps.onQuote).toHaveBeenCalled()
        })
    })
})
