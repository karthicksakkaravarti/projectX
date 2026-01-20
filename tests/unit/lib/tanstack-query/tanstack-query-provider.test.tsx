/**
 * Unit Tests: TanstackQueryProvider
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { TanstackQueryProvider } from '@/lib/tanstack-query/tanstack-query-provider'

// A child component to verify context presence
const TestChild = () => {
    const client = useQueryClient()
    return (
        <div>
            <p>Child Component</p>
            <p data-testid="client-status">
                {client ? 'Client Present' : 'Client Missing'}
            </p>
        </div>
    )
}

describe('TanstackQueryProvider', () => {
    it('should render children successfully', () => {
        render(
            <TanstackQueryProvider>
                <div>Test Content</div>
            </TanstackQueryProvider>
        )

        expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should provide a QueryClient to its children', () => {
        render(
            <TanstackQueryProvider>
                <TestChild />
            </TanstackQueryProvider>
        )

        expect(screen.getByText('Child Component')).toBeInTheDocument()
        expect(screen.getByTestId('client-status')).toHaveTextContent('Client Present')
    })
})
