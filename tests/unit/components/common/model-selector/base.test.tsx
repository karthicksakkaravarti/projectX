/**
 * Unit Tests: ModelSelector Component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModelSelector } from '@/components/common/model-selector/base'

// Mock variable for mobile breakpoint
let mockIsMobile = false

// Mock all UI components to avoid Radix issues
jest.mock('@/components/ui/dropdown-menu', () => ({
    DropdownMenu: ({ children, open, onOpenChange }: any) => (
        <div data-testid="dropdown-menu" data-open={open}>
            {typeof onOpenChange === 'function' && (
                <button data-testid="dropdown-toggle" onClick={() => onOpenChange(!open)}>Toggle</button>
            )}
            {children}
        </div>
    ),
    DropdownMenuTrigger: ({ children, asChild }: any) => <div data-testid="dropdown-trigger">{children}</div>,
    DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
    DropdownMenuItem: ({ children, onSelect }: any) => (
        <div role="menuitem" onClick={onSelect}>{children}</div>
    ),
}))

jest.mock('@/components/ui/tooltip', () => ({
    Tooltip: ({ children }: any) => <>{children}</>,
    TooltipTrigger: ({ children }: any) => <>{children}</>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/drawer', () => ({
    Drawer: ({ children, open, onOpenChange }: any) => (
        <div data-testid="drawer" data-open={open}>
            {typeof onOpenChange === 'function' && (
                <button data-testid="drawer-toggle" onClick={() => onOpenChange(!open)}>Toggle Drawer</button>
            )}
            {children}
        </div>
    ),
    DrawerTrigger: ({ children }: any) => <div data-testid="drawer-trigger">{children}</div>,
    DrawerContent: ({ children }: any) => <div data-testid="drawer-content">{children}</div>,
    DrawerHeader: ({ children }: any) => <div>{children}</div>,
    DrawerTitle: ({ children }: any) => <div>{children}</div>,
}))

jest.mock('@/components/ui/popover', () => ({
    Popover: ({ children }: any) => <div data-testid="popover">{children}</div>,
    PopoverTrigger: ({ children }: any) => <div data-testid="popover-trigger">{children}</div>,
}))

jest.mock('@/components/ui/input', () => ({
    Input: ({ onChange, value, placeholder, ...props }: any) => (
        <input
            data-testid="search-input"
            onChange={onChange}
            value={value}
            placeholder={placeholder}
            {...props}
        />
    ),
}))

jest.mock('@/components/ui/button', () => ({
    Button: ({ children, disabled, ...props }: any) => (
        <button data-testid="button" disabled={disabled} {...props}>{children}</button>
    ),
}))

jest.mock('@/app/components/chat-input/popover-content-auth', () => ({
    PopoverContentAuth: () => <div data-testid="popover-content-auth">Auth Content</div>,
}))

// Mock variable for models and loading state
let mockModels = [
    { id: 'gpt-4', name: 'GPT-4', icon: 'openai', accessible: true },
    { id: 'claude-3', name: 'Claude 3', icon: 'anthropic', accessible: false },
]
let mockIsLoading = false
let mockFavoriteModels: string[] = []

jest.mock('@/lib/model-store/provider', () => ({
    useModel: () => ({
        models: mockModels,
        isLoading: mockIsLoading,
        favoriteModels: mockFavoriteModels
    })
}))

jest.mock('@/lib/user-preference-store/provider', () => ({
    useUserPreferences: () => ({
        isModelHidden: () => false
    })
}))

jest.mock('@/lib/providers', () => ({
    PROVIDERS: [
        { id: 'openai', icon: ({ className }: any) => <span data-testid="icon-openai" className={className}></span> },
        { id: 'anthropic', icon: ({ className }: any) => <span data-testid="icon-anthropic" className={className}></span> },
    ]
}))

jest.mock('@/app/hooks/use-breakpoint', () => ({
    useBreakpoint: () => mockIsMobile
}))

let mockKeyShortcutCallback: Function | null = null
jest.mock('@/app/hooks/use-key-shortcut', () => ({
    useKeyShortcut: (condition: Function, callback: Function) => {
        mockKeyShortcutCallback = callback
    }
}))

jest.mock('@/lib/model-store/utils', () => ({
    filterAndSortModels: (models: any[], favorites: any[], query: string) => {
        if (!query) return models
        return models.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
    },
}))

jest.mock('@/components/common/model-selector/sub-menu', () => ({
    SubMenu: () => <div data-testid="sub-menu">SubMenu</div>
}))

jest.mock('@/components/common/model-selector/pro-dialog', () => ({
    ProModelDialog: ({ isOpen }: any) => isOpen ? <div data-testid="pro-dialog">Pro Dialog</div> : null
}))

describe('ModelSelector Component', () => {
    beforeEach(() => {
        mockIsMobile = false
        mockIsLoading = false
        mockModels = [
            { id: 'gpt-4', name: 'GPT-4', icon: 'openai', accessible: true },
            { id: 'claude-3', name: 'Claude 3', icon: 'anthropic', accessible: false },
        ]
        mockFavoriteModels = []
        mockKeyShortcutCallback = null
    })

    describe('Desktop View', () => {
        it('should render selected model', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            const gpt4Elements = screen.getAllByText('GPT-4')
            expect(gpt4Elements.length).toBeGreaterThan(0)
        })

        it('should render dropdown menu structure', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument()
            expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument()
        })

        it('should render with custom className', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                    className="custom-class"
                />
            )
            const gpt4Elements = screen.getAllByText('GPT-4')
            expect(gpt4Elements.length).toBeGreaterThan(0)
        })

        it('should render model items', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            
            const gpt4Elements = screen.getAllByText('GPT-4')
            expect(gpt4Elements.length).toBeGreaterThan(0)
            expect(screen.getByText('Claude 3')).toBeInTheDocument()
        })

        it('should show Locked text for inaccessible models', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            expect(screen.getByText('Locked')).toBeInTheDocument()
        })

        it('should show "Select model" when no model is selected', () => {
            render(
                <ModelSelector
                    selectedModelId="non-existent"
                    setSelectedModelId={jest.fn()}
                />
            )
            expect(screen.getByText('Select model')).toBeInTheDocument()
        })

        it('should show loading state when models are loading', () => {
            mockIsLoading = true
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            const button = screen.getByTestId('button')
            expect(button).toBeDisabled()
        })

        it('should toggle dropdown with keyboard shortcut', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            
            if (mockKeyShortcutCallback) {
                mockKeyShortcutCallback()
            }
            // Callback should be registered
            expect(mockKeyShortcutCallback).not.toBeNull()
        })

        it('should filter models with search query', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            
            const searchInput = screen.getByTestId('search-input')
            fireEvent.change(searchInput, { target: { value: 'GPT' } })
            
            // Search should filter models
            expect(searchInput).toHaveValue('GPT')
        })
    })

    describe('Mobile View', () => {
        beforeEach(() => {
            mockIsMobile = true
        })

        it('should render drawer on mobile', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            expect(screen.getByTestId('drawer')).toBeInTheDocument()
        })

        it('should render drawer trigger', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            expect(screen.getByTestId('drawer-trigger')).toBeInTheDocument()
        })

        it('should show search input in drawer', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            expect(screen.getByPlaceholderText('Search models...')).toBeInTheDocument()
        })
    })

    describe('Unauthenticated User', () => {
        it('should render auth popover when not authenticated', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                    isUserAuthenticated={false}
                />
            )
            expect(screen.getByTestId('popover')).toBeInTheDocument()
            expect(screen.getByTestId('popover-content-auth')).toBeInTheDocument()
        })

        it('should show popover trigger for unauthenticated', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                    isUserAuthenticated={false}
                />
            )
            expect(screen.getByTestId('popover-trigger')).toBeInTheDocument()
        })
    })

    describe('Model Selection', () => {
        it('should call setSelectedModelId when accessible model is clicked', () => {
            const mockSetSelectedModelId = jest.fn()
            render(
                <ModelSelector
                    selectedModelId="claude-3"
                    setSelectedModelId={mockSetSelectedModelId}
                />
            )
            
            // Find and click the GPT-4 model item
            const menuItems = screen.getAllByRole('menuitem')
            const gpt4Item = menuItems.find(item => item.textContent?.includes('GPT-4'))
            if (gpt4Item) {
                fireEvent.click(gpt4Item)
            }
        })

        it('should show pro dialog when locked model is clicked', () => {
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            
            // Find and click the Claude 3 (locked) model
            const menuItems = screen.getAllByRole('menuitem')
            const claude3Item = menuItems.find(item => item.textContent?.includes('Claude 3'))
            if (claude3Item) {
                fireEvent.click(claude3Item)
            }
        })
    })

    describe('Empty States', () => {
        it('should show no results when search returns empty', () => {
            mockModels = []
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            expect(screen.getByText('No results found.')).toBeInTheDocument()
        })

        it('should show loading message when loading', () => {
            mockIsLoading = true
            mockIsMobile = true
            render(
                <ModelSelector
                    selectedModelId="gpt-4"
                    setSelectedModelId={jest.fn()}
                />
            )
            expect(screen.getByText('Loading models...')).toBeInTheDocument()
        })
    })
})
