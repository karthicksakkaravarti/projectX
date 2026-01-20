/**
 * Unit Tests: ToolInvocation Component
 * Tests for displaying tool calls and results
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ToolInvocation } from '@/app/components/chat/tool-invocation'

// Mock icons
jest.mock('@phosphor-icons/react', () => ({
    CaretDown: () => <span data-testid="caret-down" />,
    CheckCircle: () => <span data-testid="check-circle" />,
    Code: () => <span data-testid="code" />,
    Link: () => <span data-testid="link" />,
    Nut: () => <span data-testid="nut" />,
    Spinner: () => <span data-testid="spinner" />,
    Wrench: () => <span data-testid="wrench" />,
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => (
            <div className={className} data-testid="motion-div" {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('ToolInvocation Component', () => {
    const mockToolInvocation = {
        toolInvocation: {
            toolCallId: 'call_1',
            toolName: 'calculator',
            args: { a: 1, b: 2 },
            state: 'result',
            result: { value: 3 },
        },
    }

    describe('Single Tool View', () => {
        it('should render a single tool directly', () => {
            render(<ToolInvocation toolInvocations={[mockToolInvocation as any]} />)

            expect(screen.getByText('calculator')).toBeInTheDocument()
            expect(screen.getByTestId('check-circle')).toBeInTheDocument() // Completed state
        })

        it('should show loading state', () => {
            const loadingTool = {
                ...mockToolInvocation,
                toolInvocation: {
                    ...mockToolInvocation.toolInvocation,
                    state: 'call',
                    result: undefined,
                },
            }
            render(<ToolInvocation toolInvocations={[loadingTool as any]} />)

            expect(screen.getByText('Running')).toBeInTheDocument()
            expect(screen.getByTestId('spinner')).toBeInTheDocument()
        })
    })

    describe('Multiple Tools View', () => {
        const multipleTools = [
            mockToolInvocation,
            {
                toolInvocation: {
                    toolCallId: 'call_2',
                    toolName: 'weather',
                    args: { location: 'London' },
                    state: 'call',
                },
            },
        ] as any[]

        it('should render bundled view for multiple tools', () => {
            render(<ToolInvocation toolInvocations={multipleTools} />)

            expect(screen.getByText('Tools executed')).toBeInTheDocument()
            expect(screen.getByText('2')).toBeInTheDocument() // Count
        })

        it('should expand to show individual tools on click', () => {
            render(<ToolInvocation toolInvocations={multipleTools} />)

            fireEvent.click(screen.getByRole('button'))

            expect(screen.getByText('calculator')).toBeInTheDocument()
            expect(screen.getByText('weather')).toBeInTheDocument()
        })
    })

    describe('Result Display', () => {
        it('should display simple JSON results', () => {
            render(<ToolInvocation toolInvocations={[mockToolInvocation as any]} defaultOpen={true} />)

            // Check if args are displayed
            expect(screen.getByText('Arguments')).toBeInTheDocument()
            // Check result
            expect(screen.getByText('Result')).toBeInTheDocument()
        })
    })
})
