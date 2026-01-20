/**
 * Unit Tests: Reasoning Component
 * Tests for the Reasoning component that displays AI thought process
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Reasoning } from '@/app/components/chat/reasoning'

// Mock dependencies
jest.mock('@/components/prompt-kit/markdown', () => ({
    Markdown: ({ children }: { children: string }) => (
        <div data-testid="markdown-content">{children}</div>
    ),
}))

jest.mock('@phosphor-icons/react', () => ({
    CaretDownIcon: ({ className }: { className?: string }) => (
        <span data-testid="caret-icon" className={className}>▼</span>
    ),
}))

jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => (
            <div data-testid="motion-div" className={className} {...props}>
                {children}
            </div>
        ),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
}))

describe('Reasoning Component', () => {
    const defaultProps = {
        reasoning: 'This is the reasoning text.',
        isStreaming: false,
    }

    describe('rendering', () => {
        it('should render the toggle button', () => {
            render(<Reasoning {...defaultProps} />)

            expect(screen.getByText('Reasoning')).toBeInTheDocument()
            expect(screen.getByTestId('caret-icon')).toBeInTheDocument()
        })

        it('should render reasoning content when expanded (default is expanded when isStreaming=true)', () => {
            render(<Reasoning {...defaultProps} isStreaming={true} />)

            expect(screen.getByTestId('markdown-content')).toHaveTextContent('This is the reasoning text.')
        })
    })

    describe('interactions', () => {
        it('should toggle content visibility on click', async () => {
            const user = userEvent.setup()

            // Start expanded (isStreaming default logic in component)
            // But wait, the component logic sets isExpanded based on isStreaming on initial mount:
            // const [isExpanded, setIsExpanded] = useState(() => isStreaming ?? true)
            // If isStreaming is false (default in my test props), isExpanded is TRUE? No wait:
            // useState(() => isStreaming ?? true) -> if false, it's false. If undefined, it's true.
            // Let's check the code:
            // const [isExpanded, setIsExpanded] = useState(() => isStreaming ?? true)

            // Re-reading code:
            // isStreaming ?? true
            // if isStreaming is false, result is false.
            // if isStreaming is undefined, result is true.
            // But wait `??` checks for nullish. false is not nullish.
            // So if isStreaming=false, initial state is false.

            render(<Reasoning {...defaultProps} isStreaming={undefined} />)

            // Default should be expanded if isStreaming is undefined
            expect(screen.getByTestId('markdown-content')).toBeInTheDocument()

            // Click to collapse
            await user.click(screen.getByText('Reasoning'))

            expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument()

            // Click to expand again
            await user.click(screen.getByText('Reasoning'))

            expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
        })

        it('should start collapsed when isStreaming is false', () => {
            render(<Reasoning {...defaultProps} isStreaming={false} />)
            expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument()
        })

        it('should auto-collapse when streaming finishes', () => {
            const { rerender } = render(<Reasoning reasoning="test" isStreaming={true} />)

            // Initially expanded while streaming
            expect(screen.getByTestId('markdown-content')).toBeInTheDocument()

            // Rerender with isStreaming = false
            rerender(<Reasoning reasoning="test" isStreaming={false} />)

            // Should collapse
            expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument()
        })
    })

    describe('styling', () => {
        it('should rotate caret when expanded', () => {
            render(<Reasoning {...defaultProps} isStreaming={undefined} />)

            expect(screen.getByTestId('caret-icon')).toHaveClass('rotate-180')
        })

        it('should not rotate caret when collapsed', async () => {
            const user = userEvent.setup()
            render(<Reasoning {...defaultProps} isStreaming={undefined} />)

            await user.click(screen.getByText('Reasoning'))

            expect(screen.getByTestId('caret-icon')).not.toHaveClass('rotate-180')
        })
    })
})
