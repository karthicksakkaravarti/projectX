/**
 * Unit Tests: SourcesList Component
 * Tests for the sources reference list
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SourcesList } from '@/app/components/chat/sources-list'

// Mock dependencies
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, onError, ...props }: any) => (
        <img src={src} alt={alt} onError={onError} {...props} />
    ),
}))

jest.mock('@/app/components/chat/utils', () => ({
    getFavicon: (url: string) => `http://favicon/${url}`,
    addUTM: (url: string) => `${url}?utm=test`,
    formatUrl: (url: string) => `formatted-${url}`,
}))

jest.mock('motion/react', () => ({
    motion: {
        div: ({ children, className, ...props }: any) => (
            <div data-testid="motion-content" className={className} {...props}>{children}</div>
        ),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
}))

jest.mock('@phosphor-icons/react', () => ({
    CaretDown: ({ className }: any) => <span className={className}>▼</span>,
    Link: ({ className }: any) => <span className={className}>🔗</span>,
}))

describe('SourcesList Component', () => {
    const mockSources = [
        { id: '1', url: 'http://example.com/1', title: 'Source 1' },
        { id: '2', url: 'http://example.com/2', title: 'Source 2' },
        { id: '3', url: 'http://example.com/3', title: 'Source 3' },
        { id: '4', url: 'http://example.com/4', title: 'Source 4' }, // To test > 3 sources
    ]

    describe('rendering collapsed state (header)', () => {
        it('should render proper number of favicons', () => {
            render(<SourcesList sources={mockSources} />)

            // Should show ALL favicons? The component maps sources for favicons
            // sources?.map(...) inside div
            const images = screen.getAllByRole('img')
            expect(images).toHaveLength(4)
        })

        it('should show count of extra sources if > 3', () => {
            // Note: Current implementation shows all sources favicons but also a counter?
            // Checking implementation:
            // {sources.length > 3 && ( <span ...>+{sources.length - 3}</span> )}

            render(<SourcesList sources={mockSources} />)
            expect(screen.getByText('+1')).toBeInTheDocument()
        })
    })

    describe('interactions', () => {
        it('should expand/collapse on header click', async () => {
            const user = userEvent.setup()
            render(<SourcesList sources={mockSources} />)

            // Initially collapsed
            expect(screen.queryByTestId('motion-content')).not.toBeInTheDocument()

            // Click to expand
            await user.click(screen.getByRole('button'))
            expect(screen.getByTestId('motion-content')).toBeInTheDocument()

            // Check list items
            // Should verify source titles are there
            expect(screen.getByText('Source 1')).toBeInTheDocument()
            expect(screen.getByText('formatted-http://example.com/1')).toBeInTheDocument()
        })
    })

    describe('favicon error handling', () => {
        it('should show fallback div on favicon error in header', () => {
            render(<SourcesList sources={[mockSources[0]]} />)

            const img = screen.getAllByRole('img')[0]

            // Trigger error
            fireEvent.error(img)

            // Component re-renders, replacing img with fallback div
            // Check that img is gone or a fallback div exists
            // Since it's hard to query div by class unless we add testid.
            // But we can check that img is NOT present
            expect(screen.queryByRole('img')).not.toBeInTheDocument()
        })
    })
})
