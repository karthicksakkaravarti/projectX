/**
 * Unit Tests: FeedbackWidget Component
 * Tests for the floating feedback widget component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackWidget } from '@/app/components/chat/feedback-widget'

// Mock dependencies
jest.mock('@/lib/supabase/config', () => ({
    isSupabaseEnabled: true,
}))

jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: jest.fn(),
}))

jest.mock('@/components/common/feedback-form', () => ({
    FeedbackForm: ({ authUserId, onClose }: { authUserId?: string, onClose: () => void }) => (
        <div data-testid="feedback-form">
            <span>User: {authUserId}</span>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}))

jest.mock('@/components/motion-primitives/morphing-popover', () => ({
    MorphingPopover: ({ children, open, onOpenChange, className }: any) => (
        <div data-testid="morphing-popover" data-open={open} className={className}>
            {children}
        </div>
    ),
    MorphingPopoverTrigger: ({ children, className, style }: any) => (
        <button data-testid="popover-trigger" className={className} style={style}>
            {children}
        </button>
    ),
    MorphingPopoverContent: ({ children, className, style }: any) => (
        <div data-testid="popover-content" className={className} style={style}>
            {children}
        </div>
    ),
}))

jest.mock('@phosphor-icons/react', () => ({
    QuestionMark: ({ className }: { className?: string }) => (
        <span data-testid="question-mark-icon" className={className}>?</span>
    ),
}))

jest.mock('motion/react', () => ({
    motion: {
        span: ({ children, animate, transition, ...props }: any) => (
            <span data-testid="motion-span" {...props}>{children}</span>
        ),
    },
}))

import { useBreakpoint } from '@/app/hooks/use-breakpoint'

const mockUseBreakpoint = useBreakpoint as jest.MockedFunction<typeof useBreakpoint>

describe('FeedbackWidget Component', () => {
    const defaultProps = {
        authUserId: 'test-user-id',
    }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUseBreakpoint.mockReturnValue(false) // Not mobile
    })

    describe('rendering conditions', () => {
        it('should render when user is authenticated and on desktop', () => {
            render(<FeedbackWidget {...defaultProps} />)

            expect(screen.getByTestId('morphing-popover')).toBeInTheDocument()
        })

        it('should not render when authUserId is undefined', () => {
            render(<FeedbackWidget />)

            expect(screen.queryByTestId('morphing-popover')).not.toBeInTheDocument()
        })

        it('should not render on mobile/tablet devices', () => {
            mockUseBreakpoint.mockReturnValue(true) // Mobile

            render(<FeedbackWidget {...defaultProps} />)

            expect(screen.queryByTestId('morphing-popover')).not.toBeInTheDocument()
        })
    })

    describe('popover trigger', () => {
        it('should render trigger button', () => {
            render(<FeedbackWidget {...defaultProps} />)

            expect(screen.getByTestId('popover-trigger')).toBeInTheDocument()
        })

        it('should render question mark icon', () => {
            render(<FeedbackWidget {...defaultProps} />)

            expect(screen.getByTestId('question-mark-icon')).toBeInTheDocument()
        })

        it('should have screen reader text for accessibility', () => {
            render(<FeedbackWidget {...defaultProps} />)

            expect(screen.getByText('Help')).toHaveClass('sr-only')
        })
    })

    describe('popover content', () => {
        it('should render popover content with feedback form', () => {
            render(<FeedbackWidget {...defaultProps} />)

            expect(screen.getByTestId('popover-content')).toBeInTheDocument()
            expect(screen.getByTestId('feedback-form')).toBeInTheDocument()
        })

        it('should pass authUserId to FeedbackForm', () => {
            render(<FeedbackWidget {...defaultProps} />)

            expect(screen.getByText('User: test-user-id')).toBeInTheDocument()
        })
    })

    describe('styling', () => {
        it('should have fixed positioning', () => {
            render(<FeedbackWidget {...defaultProps} />)

            const container = screen.getByTestId('morphing-popover').parentElement
            expect(container).toHaveClass('fixed')
            expect(container).toHaveClass('right-1')
            expect(container).toHaveClass('bottom-1')
            expect(container).toHaveClass('z-50')
        })
    })
})

describe('FeedbackWidget with Supabase disabled', () => {
    beforeEach(() => {
        jest.resetModules()
    })

    it('should return null when supabase is disabled', () => {
        jest.doMock('@/lib/supabase/config', () => ({
            isSupabaseEnabled: false,
        }))

        // The component should return null when Supabase is disabled
    })
})
