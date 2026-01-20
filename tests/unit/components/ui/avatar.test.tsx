/**
 * Unit Tests: Avatar Component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock Radix Avatar due to image loading issues in jsdom
jest.mock('@radix-ui/react-avatar', () => ({
    Root: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
        <span ref={ref} className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className || ''}`} {...props}>{children}</span>
    )),
    Image: React.forwardRef(({ src, alt, className, ...props }: any, ref: any) => (
        <img ref={ref} src={src} alt={alt} className={className} {...props} />
    )),
    Fallback: React.forwardRef(({ children, className, ...props }: any, ref: any) => (
        <span ref={ref} className={className} {...props}>{children}</span>
    )),
}))

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

describe('Avatar Component', () => {
    it('should render fallback when no image provided', () => {
        render(
            <Avatar>
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
        )
        expect(screen.getByText('CN')).toBeInTheDocument()
    })

    it('should render image element when src is provided', () => {
        render(
            <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
        )
        // Check that an img element exists with the correct src
        const img = screen.getByRole('img', { name: '@shadcn' })
        expect(img).toBeInTheDocument()
        expect(img).toHaveAttribute('src', 'https://github.com/shadcn.png')
    })

    it('should apply custom classes', () => {
        render(
            <Avatar className="h-20 w-20">
                <AvatarFallback>LG</AvatarFallback>
            </Avatar>
        )
        const fallback = screen.getByText('LG')
        const avatar = fallback.parentElement
        expect(avatar).toHaveClass('h-20')
        expect(avatar).toHaveClass('w-20')
    })

    it('should render with correct structure', () => {
        const { container } = render(
            <Avatar>
                <AvatarImage src="/avatar.png" alt="Avatar" />
                <AvatarFallback>AB</AvatarFallback>
            </Avatar>
        )

        const root = container.firstChild
        expect(root).toHaveClass('rounded-full')
        expect(root).toHaveClass('overflow-hidden')
    })
})
