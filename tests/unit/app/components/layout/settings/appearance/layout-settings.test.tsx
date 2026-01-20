import { render, screen, fireEvent } from '@testing-library/react'
import { LayoutSettings } from '@/app/components/layout/settings/appearance/layout-settings'
import { useUserPreferences } from '@/lib/user-preference-store/provider'

// Mock the user preferences hook
jest.mock('@/lib/user-preference-store/provider', () => ({
    useUserPreferences: jest.fn(),
}))

describe('LayoutSettings', () => {
    const mockSetLayout = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks();
        (useUserPreferences as jest.Mock).mockReturnValue({
            preferences: { layout: 'sidebar' }, // Default to sidebar
            setLayout: mockSetLayout,
        })
    })

    test('renders layout selection header', () => {
        render(<LayoutSettings />)
        expect(screen.getByText('Layout')).toBeInTheDocument()
    })

    test('renders sidebar and fullscreen options', () => {
        render(<LayoutSettings />)
        const buttons = screen.getAllByRole('button')
        expect(buttons).toHaveLength(2)
    })

    test('highlights active layout (sidebar)', () => {
        render(<LayoutSettings />)
        const buttons = screen.getAllByRole('button')
        // First button (sidebar) should have active styles
        expect(buttons[0]).toHaveClass('ring-2')
        // Second button (fullscreen) should default style
        expect(buttons[1]).not.toHaveClass('ring-2')
    })

    test('highlights active layout (fullscreen)', () => {
        (useUserPreferences as jest.Mock).mockReturnValue({
            preferences: { layout: 'fullscreen' },
            setLayout: mockSetLayout,
        })

        render(<LayoutSettings />)
        const buttons = screen.getAllByRole('button')

        expect(buttons[0]).not.toHaveClass('ring-2')
        expect(buttons[1]).toHaveClass('ring-2')
    })

    test('calls setLayout with "sidebar" when sidebar option is clicked', () => {
        (useUserPreferences as jest.Mock).mockReturnValue({
            preferences: { layout: 'fullscreen' }, // Start with fullscreen
            setLayout: mockSetLayout,
        })
        render(<LayoutSettings />)
        const buttons = screen.getAllByRole('button')

        // Click sidebar button (first one)
        fireEvent.click(buttons[0])
        expect(mockSetLayout).toHaveBeenCalledWith('sidebar')
    })

    test('calls setLayout with "fullscreen" when fullscreen option is clicked', () => {
        render(<LayoutSettings />)
        const buttons = screen.getAllByRole('button')

        // Click fullscreen button (second one)
        fireEvent.click(buttons[1])
        expect(mockSetLayout).toHaveBeenCalledWith('fullscreen')
    })
})
