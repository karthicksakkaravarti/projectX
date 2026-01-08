/**
 * Unit Tests: Button Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, buttonVariants } from '@/components/ui/button'

describe('Button Component', () => {
    describe('Rendering', () => {
        it('should render a button element', () => {
            render(<Button>Click me</Button>)
            expect(screen.getByRole('button')).toBeInTheDocument()
        })

        it('should render children correctly', () => {
            render(<Button>Click me</Button>)
            expect(screen.getByText('Click me')).toBeInTheDocument()
        })

        it('should apply default variant classes', () => {
            render(<Button>Click me</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('bg-primary')
        })

        it('should have data-slot attribute', () => {
            render(<Button>Click me</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveAttribute('data-slot', 'button')
        })
    })

    describe('Variants', () => {
        it('should apply destructive variant', () => {
            render(<Button variant="destructive">Delete</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('bg-destructive')
        })

        it('should apply outline variant', () => {
            render(<Button variant="outline">Outline</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('border')
        })

        it('should apply secondary variant', () => {
            render(<Button variant="secondary">Secondary</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('bg-secondary')
        })

        it('should apply ghost variant', () => {
            render(<Button variant="ghost">Ghost</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('hover:bg-accent')
        })

        it('should apply link variant', () => {
            render(<Button variant="link">Link</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('underline-offset-4')
        })
    })

    describe('Sizes', () => {
        it('should apply default size', () => {
            render(<Button>Default</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('h-9')
        })

        it('should apply small size', () => {
            render(<Button size="sm">Small</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('h-8')
        })

        it('should apply large size', () => {
            render(<Button size="lg">Large</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('h-10')
        })

        it('should apply icon size', () => {
            render(<Button size="icon">🔍</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('size-9')
        })
    })

    describe('Interactions', () => {
        it('should call onClick when clicked', async () => {
            const user = userEvent.setup()
            const handleClick = jest.fn()

            render(<Button onClick={handleClick}>Click me</Button>)

            await user.click(screen.getByRole('button'))

            expect(handleClick).toHaveBeenCalledTimes(1)
        })

        it('should not call onClick when disabled', async () => {
            const user = userEvent.setup()
            const handleClick = jest.fn()

            render(<Button onClick={handleClick} disabled>Click me</Button>)

            await user.click(screen.getByRole('button'))

            expect(handleClick).not.toHaveBeenCalled()
        })

        it('should be focusable', async () => {
            const user = userEvent.setup()

            render(<Button>Focus me</Button>)

            await user.tab()

            expect(screen.getByRole('button')).toHaveFocus()
        })
    })

    describe('Disabled State', () => {
        it('should have disabled attribute when disabled', () => {
            render(<Button disabled>Disabled</Button>)
            expect(screen.getByRole('button')).toBeDisabled()
        })

        it('should have disabled styling when disabled', () => {
            render(<Button disabled>Disabled</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('disabled:pointer-events-none')
            expect(button).toHaveClass('disabled:opacity-50')
        })
    })

    describe('Custom className', () => {
        it('should merge custom className', () => {
            render(<Button className="custom-class">Custom</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('custom-class')
        })

        it('should allow overriding default classes', () => {
            render(<Button className="h-20">Tall</Button>)
            const button = screen.getByRole('button')
            expect(button).toHaveClass('h-20')
        })
    })

    describe('asChild prop', () => {
        it('should render as Slot when asChild is true', () => {
            render(
                <Button asChild>
                    <a href="/test">Link Button</a>
                </Button>
            )
            expect(screen.getByRole('link')).toBeInTheDocument()
        })

        it('should pass props to child when asChild', () => {
            render(
                <Button asChild className="button-class">
                    <a href="/test">Link Button</a>
                </Button>
            )
            const link = screen.getByRole('link')
            expect(link).toHaveClass('button-class')
        })
    })

    describe('buttonVariants', () => {
        it('should export buttonVariants function', () => {
            expect(typeof buttonVariants).toBe('function')
        })

        it('should return class string', () => {
            const classes = buttonVariants({ variant: 'default', size: 'default' })
            expect(typeof classes).toBe('string')
        })

        it('should generate classes for different variants', () => {
            const defaultClasses = buttonVariants({ variant: 'default' })
            const destructiveClasses = buttonVariants({ variant: 'destructive' })

            expect(defaultClasses).not.toBe(destructiveClasses)
        })
    })

    describe('Accessibility', () => {
        it('should have correct role', () => {
            render(<Button>Accessible</Button>)
            expect(screen.getByRole('button')).toBeInTheDocument()
        })

        it('should support aria-label', () => {
            render(<Button aria-label="Close dialog">×</Button>)
            expect(screen.getByLabelText('Close dialog')).toBeInTheDocument()
        })

        it('should support aria-pressed', () => {
            render(<Button aria-pressed="true">Toggle</Button>)
            expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
        })
    })
})
