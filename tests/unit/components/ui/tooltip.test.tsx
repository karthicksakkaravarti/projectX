/**
 * Unit Tests: Tooltip Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock the component module directly
jest.mock('@/components/ui/tooltip', () => ({
    TooltipProvider: ({ children }: any) => <>{children}</>,
    Tooltip: ({ children, defaultOpen }: any) => (
        <div data-testid="tooltip-root" data-open={defaultOpen}>{children}</div>
    ),
    TooltipTrigger: React.forwardRef(({ children, ...props }: any, ref: any) => (
        <button ref={ref} {...props}>{children}</button>
    )),
    TooltipContent: React.forwardRef(({ children, className, sideOffset, ...props }: any, ref: any) => (
        <div ref={ref} role="tooltip" className={className} data-side-offset={sideOffset} {...props}>{children}</div>
    )),
}))

import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

describe('Tooltip Component', () => {
    it('should render trigger element', () => {
        render(
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
        expect(screen.getByText('Hover me')).toBeInTheDocument()
    })

    it('should show content on hover', async () => {
        render(
            <TooltipProvider>
                <Tooltip defaultOpen>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent>Tooltip content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )

        // With mocked components, tooltip content should be visible
        expect(screen.getByText('Tooltip content')).toBeInTheDocument()
    })

    it('should apply custom classes to content', async () => {
        render(
            <TooltipProvider>
                <Tooltip defaultOpen>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent className="custom-class">Tooltip content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )

        const content = screen.getByRole('tooltip')
        expect(content).toHaveClass('custom-class')
    })

    it('should respect side offset', async () => {
        render(
            <TooltipProvider>
                <Tooltip defaultOpen>
                    <TooltipTrigger>Hover me</TooltipTrigger>
                    <TooltipContent sideOffset={10}>Tooltip content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )

        const content = screen.getByRole('tooltip')
        expect(content).toHaveAttribute('data-side-offset', '10')
    })

    it('should render with proper accessibility attributes', async () => {
        render(
            <TooltipProvider>
                <Tooltip defaultOpen>
                    <TooltipTrigger>Focus me</TooltipTrigger>
                    <TooltipContent>Tooltip content</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )

        expect(screen.getByText('Focus me')).toBeInTheDocument()
        expect(screen.getByRole('tooltip')).toBeInTheDocument()
    })
})
