import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeSelection } from '@/app/components/layout/settings/appearance/theme-selection'
import { useTheme } from 'next-themes'

// Mock next-themes
jest.mock('next-themes', () => ({
    useTheme: jest.fn(),
}))

describe('ThemeSelection', () => {
    const mockSetTheme = jest.fn()

    beforeEach(() => {
        jest.clearAllMocks();
        (useTheme as jest.Mock).mockReturnValue({
            theme: 'system',
            setTheme: mockSetTheme,
        })
    })

    test('renders theme selection header', () => {
        render(<ThemeSelection />)
        expect(screen.getByText('Theme')).toBeInTheDocument()
    })

    test('renders all theme options', () => {
        render(<ThemeSelection />)
        expect(screen.getByText('System')).toBeInTheDocument()
        expect(screen.getByText('Light')).toBeInTheDocument()
        expect(screen.getByText('Dark')).toBeInTheDocument()
    })

    test('highlights current theme (system)', () => {
        render(<ThemeSelection />)
        // Find the button wrapping 'System' text
        const systemBtn = screen.getByText('System').closest('button')
        expect(systemBtn).toHaveClass('ring-2')

        const lightBtn = screen.getByText('Light').closest('button')
        expect(lightBtn).not.toHaveClass('ring-2')
    })

    test('highlights current theme (dark)', () => {
        (useTheme as jest.Mock).mockReturnValue({
            theme: 'dark',
            setTheme: mockSetTheme,
        })

        // Note: The component uses local state `selectedTheme` initialized from props.
        // However, if we mount fresh, it reads `theme`.
        render(<ThemeSelection />)

        const darkBtn = screen.getByText('Dark').closest('button')
        expect(darkBtn).toHaveClass('ring-2')
    })

    test('updates theme on click', () => {
        render(<ThemeSelection />)

        const lightBtn = screen.getByText('Light').closest('button')
        fireEvent.click(lightBtn!)

        expect(mockSetTheme).toHaveBeenCalledWith('light')
        expect(lightBtn).toHaveClass('ring-2') // Checks if local state updated active class
    })
})
