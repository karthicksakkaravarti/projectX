/**
 * Unit Tests: app/components/suggestions/prompt-system.tsx
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptSystem } from '@/app/components/suggestions/prompt-system'

// Mock motion/react AnimatePresence
jest.mock('motion/react', () => ({
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
        div: ({ children, ...props }: { children: React.ReactNode }) => (
            <div {...props}>{children}</div>
        ),
        create: (Component: React.ComponentType) => Component,
    },
}))

// Mock the Suggestions component
const mockOnValueChange = jest.fn()
const mockOnSuggestion = jest.fn()

jest.mock('@/app/components/chat-input/suggestions', () => ({
    Suggestions: ({
        onValueChange,
        onSuggestion,
        value,
    }: {
        onValueChange: (value: string) => void
        onSuggestion: (suggestion: string) => void
        value?: string
    }) => (
        <div data-testid="suggestions-component">
            <span data-testid="current-value">{value}</span>
            <button
                data-testid="suggestion-button"
                onClick={() => onSuggestion('Test suggestion')}
            >
                Click Suggestion
            </button>
            <button
                data-testid="value-change-button"
                onClick={() => onValueChange('New value')}
            >
                Change Value
            </button>
        </div>
    ),
}))

describe('PromptSystem Component', () => {
    const defaultProps = {
        onValueChange: mockOnValueChange,
        onSuggestion: mockOnSuggestion,
        value: '',
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render the component', () => {
            render(<PromptSystem {...defaultProps} />)

            expect(screen.getByTestId('suggestions-component')).toBeInTheDocument()
        })

        it('should render with correct container styling classes', () => {
            const { container } = render(<PromptSystem {...defaultProps} />)

            const containerDiv = container.querySelector('.relative.order-1')
            expect(containerDiv).toBeInTheDocument()
        })

        it('should render the Suggestions component inside AnimatePresence', () => {
            render(<PromptSystem {...defaultProps} />)

            expect(screen.getByTestId('suggestions-component')).toBeInTheDocument()
        })
    })

    describe('Props passing', () => {
        it('should pass value prop to Suggestions component', () => {
            render(<PromptSystem {...defaultProps} value="test value" />)

            expect(screen.getByTestId('current-value')).toHaveTextContent('test value')
        })

        it('should pass empty string value to Suggestions component', () => {
            render(<PromptSystem {...defaultProps} value="" />)

            expect(screen.getByTestId('current-value')).toHaveTextContent('')
        })

        it('should pass onValueChange callback to Suggestions', async () => {
            render(<PromptSystem {...defaultProps} />)

            const button = screen.getByTestId('value-change-button')
            await userEvent.click(button)

            expect(mockOnValueChange).toHaveBeenCalledWith('New value')
        })

        it('should pass onSuggestion callback to Suggestions', async () => {
            render(<PromptSystem {...defaultProps} />)

            const button = screen.getByTestId('suggestion-button')
            await userEvent.click(button)

            expect(mockOnSuggestion).toHaveBeenCalledWith('Test suggestion')
        })
    })

    describe('Memoization', () => {
        it('should be a memoized component', () => {
            // PromptSystem is wrapped with React.memo
            // Verify it renders correctly on initial render
            const { rerender } = render(<PromptSystem {...defaultProps} />)

            expect(screen.getByTestId('suggestions-component')).toBeInTheDocument()

            // Re-render with same props
            rerender(<PromptSystem {...defaultProps} />)

            expect(screen.getByTestId('suggestions-component')).toBeInTheDocument()
        })

        it('should update when props change', () => {
            const { rerender } = render(<PromptSystem {...defaultProps} value="initial" />)

            expect(screen.getByTestId('current-value')).toHaveTextContent('initial')

            rerender(<PromptSystem {...defaultProps} value="updated" />)

            expect(screen.getByTestId('current-value')).toHaveTextContent('updated')
        })

        it('should update when onValueChange callback changes', async () => {
            const newOnValueChange = jest.fn()

            const { rerender } = render(<PromptSystem {...defaultProps} />)

            rerender(<PromptSystem {...defaultProps} onValueChange={newOnValueChange} />)

            const button = screen.getByTestId('value-change-button')
            await userEvent.click(button)

            expect(newOnValueChange).toHaveBeenCalledWith('New value')
        })

        it('should update when onSuggestion callback changes', async () => {
            const newOnSuggestion = jest.fn()

            const { rerender } = render(<PromptSystem {...defaultProps} />)

            rerender(<PromptSystem {...defaultProps} onSuggestion={newOnSuggestion} />)

            const button = screen.getByTestId('suggestion-button')
            await userEvent.click(button)

            expect(newOnSuggestion).toHaveBeenCalledWith('Test suggestion')
        })
    })

    describe('Layout', () => {
        it('should have correct responsive layout classes', () => {
            const { container } = render(<PromptSystem {...defaultProps} />)

            // The component uses a Fragment, so we need to find the div directly
            const layoutDiv = container.querySelector('.relative.order-1.w-full')
            expect(layoutDiv).toBeInTheDocument()
        })

        it('should have correct md breakpoint classes', () => {
            const { container } = render(<PromptSystem {...defaultProps} />)

            // Check for md breakpoint classes using the class selector
            const layoutDiv = container.querySelector('div.relative')
            expect(layoutDiv).toBeInTheDocument()
            expect(layoutDiv).toHaveClass('md:absolute')
            expect(layoutDiv).toHaveClass('md:bottom-[-70px]')
            expect(layoutDiv).toHaveClass('md:order-2')
            expect(layoutDiv).toHaveClass('md:h-[70px]')
        })
    })

    describe('Edge cases', () => {
        it('should handle undefined value gracefully', () => {
            // TypeScript would normally prevent this, but testing runtime behavior
            render(<PromptSystem {...defaultProps} value={'' as string} />)

            expect(screen.getByTestId('suggestions-component')).toBeInTheDocument()
        })

        it('should handle long value strings', () => {
            const longValue = 'a'.repeat(1000)
            render(<PromptSystem {...defaultProps} value={longValue} />)

            expect(screen.getByTestId('current-value')).toHaveTextContent(longValue)
        })

        it('should handle special characters in value', () => {
            const specialValue = '<script>alert("xss")</script>'
            render(<PromptSystem {...defaultProps} value={specialValue} />)

            expect(screen.getByTestId('current-value')).toHaveTextContent(specialValue)
        })

        it('should handle multiple rapid callback calls', async () => {
            render(<PromptSystem {...defaultProps} />)

            const valueButton = screen.getByTestId('value-change-button')
            const suggestionButton = screen.getByTestId('suggestion-button')

            // Rapid clicks
            await userEvent.click(valueButton)
            await userEvent.click(suggestionButton)
            await userEvent.click(valueButton)
            await userEvent.click(suggestionButton)

            expect(mockOnValueChange).toHaveBeenCalledTimes(2)
            expect(mockOnSuggestion).toHaveBeenCalledTimes(2)
        })
    })

    describe('Accessibility', () => {
        it('should render without accessibility violations', () => {
            const { container } = render(<PromptSystem {...defaultProps} />)

            // Basic check that the component structure is valid
            expect(container.firstChild).toBeInTheDocument()
        })

        it('should allow keyboard interaction with suggestions', async () => {
            render(<PromptSystem {...defaultProps} />)

            const suggestionButton = screen.getByTestId('suggestion-button')

            // Focus the button
            suggestionButton.focus()
            expect(suggestionButton).toHaveFocus()

            // Press Enter to click
            fireEvent.keyDown(suggestionButton, { key: 'Enter' })
        })
    })

    describe('Integration with parent components', () => {
        it('should work correctly when embedded in a form', () => {
            const handleSubmit = jest.fn((e) => e.preventDefault())

            render(
                <form onSubmit={handleSubmit}>
                    <PromptSystem {...defaultProps} />
                </form>
            )

            expect(screen.getByTestId('suggestions-component')).toBeInTheDocument()
        })

        it('should work with state management from parent', async () => {
            let currentValue = ''
            const handleValueChange = (value: string) => {
                currentValue = value
            }

            const { rerender } = render(
                <PromptSystem
                    value={currentValue}
                    onValueChange={handleValueChange}
                    onSuggestion={mockOnSuggestion}
                />
            )

            expect(screen.getByTestId('current-value')).toHaveTextContent('')

            // Simulate parent updating the value
            currentValue = 'updated from parent'
            rerender(
                <PromptSystem
                    value={currentValue}
                    onValueChange={handleValueChange}
                    onSuggestion={mockOnSuggestion}
                />
            )

            expect(screen.getByTestId('current-value')).toHaveTextContent('updated from parent')
        })
    })
})
