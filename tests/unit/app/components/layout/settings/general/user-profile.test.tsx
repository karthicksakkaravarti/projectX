import React from 'react'
import { render, screen } from '@testing-library/react'
import { UserProfile } from '@/app/components/layout/settings/general/user-profile'

// Mock dependencies
const mockUser = {
    id: 'user-123',
    display_name: 'Test User',
    email: 'test@example.com',
    profile_image: 'https://example.com/avatar.jpg',
}

// We need to support changing the mock return value
let useUserMockReturn: any = { user: mockUser }

jest.mock('@/lib/user-store/provider', () => ({
    useUser: () => useUserMockReturn,
}))

// Mock UI components
jest.mock('@/components/ui/avatar', () => ({
    Avatar: ({ children, className }: { children: React.ReactNode, className?: string }) => <div data-testid="avatar" className={className}>{children}</div>,
    AvatarImage: ({ src, className }: { src: string, className?: string }) => <img src={src} className={className} alt="avatar" />,
    AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}))

describe('UserProfile Component', () => {
    beforeEach(() => {
        // Reset mock return default
        useUserMockReturn = { user: mockUser }
        jest.clearAllMocks()
    })

    test('renders user profile correctly', () => {
        render(<UserProfile />)

        expect(screen.getByText('Profile')).toBeInTheDocument()
        expect(screen.getByText('Test User')).toBeInTheDocument()
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(screen.getByRole('img', { name: /avatar/i })).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    })

    test('renders user fallback avatar when no image', () => {
        useUserMockReturn = {
            user: { ...mockUser, profile_image: null }
        }

        render(<UserProfile />)

        expect(screen.getByText('Profile')).toBeInTheDocument()
        // Should show User icon from phosphor-icons instead of AvatarImage
        // Since we are not mocking phosphor-icons specially, it might render as an SVG or similar. 
        // In the code: <User className="text-muted-foreground size-12" /> is rendered when no profile_image.
        // Let's verify Avatar is NOT rendered
        expect(screen.queryByTestId('avatar')).not.toBeInTheDocument()

        // Check for User icon presence if possible. Phosphor icons usually render an SVG.
        // We can check if the container div has the class bg-muted
        const container = screen.getByText('Profile').nextSibling?.firstChild
        expect(container).toHaveClass('bg-muted')
    })

    test('returns null when no user', () => {
        useUserMockReturn = { user: null }

        const { container } = render(<UserProfile />)
        expect(container).toBeEmptyDOMElement()
    })
})
