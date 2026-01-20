/**
 * Unit Tests: Sonner Component
 */

import React from 'react'
import { render } from '@testing-library/react'

// Mock sonner entirely due to complex portal and animation behavior
jest.mock('sonner', () => ({
    Toaster: (props: any) => (
        <div data-testid="sonner-toaster" data-sonner-toaster className="toaster group" {...props} />
    ),
}))

// Mock next-themes
jest.mock('next-themes', () => ({
    useTheme: () => ({ theme: 'light' }),
}))

import { Toaster } from '@/components/ui/sonner'

describe('Sonner Component', () => {
    it('should render toaster', () => {
        const { container } = render(<Toaster />)
        const toaster = container.querySelector('[data-testid="sonner-toaster"]')
        expect(toaster).toBeInTheDocument()
    })

    it('should render with default class', () => {
        const { container } = render(<Toaster />)
        const toaster = container.querySelector('[data-testid="sonner-toaster"]')
        expect(toaster).toHaveClass('toaster')
    })
})
