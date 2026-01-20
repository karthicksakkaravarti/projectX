/**
 * Unit Tests: SearchImages Component
 * Tests for the image search results grid component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchImages } from '@/app/components/chat/search-images'

// Mock dependencies
jest.mock('next/image', () => ({
    __esModule: true,
    default: ({ src, alt, className, onError, onLoad }: any) => (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={onError}
            onLoad={onLoad}
            data-testid="next-image"
        />
    ),
}))

jest.mock('@/app/components/chat/utils', () => ({
    addUTM: (url: string) => `${url}?utm=test`,
    getFavicon: (url: string) => `favicon-for-${url}`,
    getSiteName: (url: string) => `site-${url}`,
}))

describe('SearchImages Component', () => {
    const mockResults = [
        {
            title: 'Image 1',
            imageUrl: 'http://example.com/img1.jpg',
            sourceUrl: 'http://example.com/page1',
        },
        {
            title: 'Image 2',
            imageUrl: 'http://example.com/img2.jpg',
            sourceUrl: 'http://example.com/page2',
        },
    ]

    describe('rendering', () => {
        it('should render nothing if results are empty', () => {
            const { container } = render(<SearchImages results={[]} />)
            expect(container.firstChild).toBeNull()
        })

        it('should render image grid when results are provided', () => {
            render(<SearchImages results={mockResults} />)

            // Check for images
            expect(screen.getAllByTestId('next-image')).toHaveLength(4) // 2 main images + 2 favicons
            expect(screen.getByAltText('Image 1')).toBeInTheDocument()
            expect(screen.getByAltText('Image 2')).toBeInTheDocument()
        })

        it('should render links with UTM parameters', () => {
            render(<SearchImages results={mockResults} />)

            const links = screen.getAllByRole('link')
            expect(links[0]).toHaveAttribute('href', 'http://example.com/page1?utm=test')
        })

        it('should display site names', () => {
            render(<SearchImages results={mockResults} />)

            expect(screen.getByText('site-http://example.com/page1')).toBeInTheDocument()
        })

        it('should display image titles', () => {
            render(<SearchImages results={mockResults} />)

            expect(screen.getByText('Image 1')).toBeInTheDocument()
        })
    })

    describe('interactions', () => {
        it('should remove opacity-0 class on image load', () => {
            render(<SearchImages results={[mockResults[0]]} />)

            const img = screen.getByAltText('Image 1')
            expect(img).toHaveClass('opacity-0')

            fireEvent.load(img)

            expect(img).not.toHaveClass('opacity-0')
        })

        it('should hide image on error', () => {
            render(<SearchImages results={[mockResults[0]]} />)

            const img = screen.getByAltText('Image 1')

            // Trigger error
            fireEvent.error(img)

            // Re-render happens, component should remove the errored item from DOM
            expect(screen.queryByAltText('Image 1')).not.toBeInTheDocument()
        })
    })
})
